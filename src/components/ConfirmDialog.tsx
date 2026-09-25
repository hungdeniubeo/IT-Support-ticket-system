import { useEffect, useRef, type ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  busy?: boolean
  icon?: ReactNode
  onConfirm(): void
  onCancel(): void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Hủy',
  destructive = false,
  busy = false,
  icon,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const onCancelRef = useRef(onCancel)
  const busyRef = useRef(busy)
  onCancelRef.current = onCancel
  busyRef.current = busy

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    cancelRef.current?.focus()
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busyRef.current) {
        event.preventDefault()
        onCancelRef.current()
      }
      if (event.key !== 'Tab') return
      const elements = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')
      if (!elements?.length) return
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previous?.focus()
    }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/35 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel() }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description" className="w-full max-w-[420px] rounded-lg border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
        <span className={`flex size-9 items-center justify-center rounded-md ${destructive ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'}`} aria-hidden="true">
          {icon ?? <CircleAlert size={17} />}
        </span>
        <h2 id="confirm-dialog-title" className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
        <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button ref={cancelRef} type="button" onClick={onCancel} disabled={busy}>{cancelLabel}</Button>
          <Button type="button" variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Đang xử lý…' : confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  )
}
