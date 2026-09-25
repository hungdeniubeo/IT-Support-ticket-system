import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Check, CircleAlert, Info, X } from 'lucide-react'

type ToastTone = 'success' | 'error' | 'info'
interface ToastMessage { id: number; message: string; tone: ToastTone }
interface ToastContextValue { showToast(message: string, tone?: ToastTone): void }

const ToastContext = createContext<ToastContextValue | null>(null)
const icons = { success: Check, error: CircleAlert, info: Info }
const tones = {
  success: 'border-emerald-200 bg-white text-emerald-900',
  error: 'border-rose-200 bg-white text-rose-900',
  info: 'border-slate-200 bg-white text-slate-800',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((current) => [...current.slice(-2), { id, message, tone }])
  }, [])

  useEffect(() => {
    const timers = toasts.map((toast) => window.setTimeout(() => dismiss(toast.id), 4200))
    return () => timers.forEach(window.clearTimeout)
  }, [toasts, dismiss])

  const value = useMemo(() => ({ showToast }), [showToast])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite" aria-relevant="additions text">
        {toasts.map((toast) => {
          const Icon = icons[toast.tone]
          return (
            <div key={toast.id} role={toast.tone === 'error' ? 'alert' : 'status'} className={`pointer-events-auto flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-sm shadow-lg ${tones[toast.tone]}`}>
              <Icon size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p className="min-w-0 flex-1 leading-5">{toast.message}</p>
              <button type="button" onClick={() => dismiss(toast.id)} aria-label="Đóng thông báo" className="-mr-1 -mt-1 flex size-7 shrink-0 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"><X size={15} /></button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider.')
  return context
}
