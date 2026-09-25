import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'

export interface ActionMenuItem {
  label: string
  onSelect(): void
  destructive?: boolean
  disabled?: boolean
  icon?: ReactNode
}

export function ActionMenu({ items, label = 'Thao tác khác' }: { items: readonly ActionMenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button ref={triggerRef} type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((value) => !value)} className="flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300">
        <MoreHorizontal size={17} />
      </button>
      {open && (
        <div id={menuId} role="menu" className="absolute right-0 top-full z-50 mt-1 min-w-48 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => { setOpen(false); item.onSelect(); triggerRef.current?.focus() }}
              className={`flex min-h-9 w-full items-center gap-2 rounded px-2.5 text-left text-[13px] transition-colors duration-150 disabled:opacity-50 ${item.destructive ? 'text-rose-700 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              {item.icon && <span className="flex size-4 items-center justify-center" aria-hidden="true">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
