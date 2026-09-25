import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  tone?: string
}

interface SelectProps {
  id?: string
  value: string
  options: readonly SelectOption[]
  placeholder: string
  disabled?: boolean
  required?: boolean
  invalid?: boolean
  describedBy?: string
  onChange(value: string): void
}

export function Select({ id, value, options, placeholder, disabled, required, invalid, describedBy, onChange }: SelectProps) {
  const generatedId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listId = id ? `${id}-listbox` : `select-${generatedId}`
  const [open, setOpen] = useState(false)
  const [openAbove, setOpenAbove] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const selectedIndex = options.findIndex((option) => option.value === value)
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined

  useEffect(() => {
    if (!open) return
    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const menuHeight = Math.min(options.length * 36 + 8, 288)
      const spaceBelow = window.innerHeight - rect.bottom
      setOpenAbove(spaceBelow < menuHeight + 12 && rect.top > spaceBelow)
    }
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    updatePosition()
    document.addEventListener('pointerdown', closeOutside)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, options.length])

  function showMenu(index = selectedIndex >= 0 ? selectedIndex : 0) {
    setActiveIndex(Math.max(0, Math.min(index, options.length - 1)))
    setOpen(true)
  }

  function choose(option: SelectOption) {
    onChange(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!open) showMenu()
      else setActiveIndex((index) => Math.min(options.length - 1, index + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) showMenu(selectedIndex >= 0 ? selectedIndex : options.length - 1)
      else setActiveIndex((index) => Math.max(0, index - 1))
    } else if (event.key === 'Home' && open) {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End' && open) {
      event.preventDefault()
      setActiveIndex(options.length - 1)
    } else if ((event.key === 'Enter' || event.key === ' ') && !open) {
      event.preventDefault()
      showMenu()
    } else if ((event.key === 'Enter' || event.key === ' ') && open) {
      event.preventDefault()
      const option = options[activeIndex]
      if (option) choose(option)
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
    } else if (event.key === 'Tab' && open) {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-required={required || undefined}
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && options[activeIndex] ? `${listId}-option-${activeIndex}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => open ? setOpen(false) : showMenu()}
        onKeyDown={handleKeyDown}
        className={`flex h-10 w-full items-center gap-2 rounded-md border bg-white px-3 text-left text-[13px] outline-none transition-[border-color,box-shadow,background-color] duration-150 focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${invalid ? 'border-rose-300' : 'border-slate-200'} ${selectedOption ? 'text-slate-800' : 'text-slate-400'}`}
      >
        {selectedOption?.tone && <span className={`size-1.5 shrink-0 rounded-full ${selectedOption.tone}`} aria-hidden="true" />}
        <span className="min-w-0 flex-1 truncate">{selectedOption?.label ?? placeholder}</span>
        <ChevronDown size={15} className={`shrink-0 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-labelledby={id}
          data-placement={openAbove ? 'above' : 'below'}
          className={`select-popover absolute z-50 max-h-[min(18rem,calc(100dvh-1.5rem))] w-full overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg outline-none ${openAbove ? 'bottom-full mb-1' : 'top-full mt-1'}`}
        >
          {options.map((option, index) => (
            <button
              id={`${listId}-option-${index}`}
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              tabIndex={-1}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(option)}
              className={`flex min-h-9 w-full items-center gap-2 rounded px-2.5 text-left text-[13px] transition-colors duration-150 ${index === activeIndex ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'} ${option.value === value ? 'font-medium' : ''}`}
            >
              {option.tone && <span className={`size-1.5 shrink-0 rounded-full ${option.tone}`} aria-hidden="true" />}
              <span className="min-w-0 flex-1">{option.label}</span>
              {option.value === value && <Check size={14} className="shrink-0 text-slate-600" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
