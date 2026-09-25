import type { ReactNode } from 'react'
import { SearchX } from 'lucide-react'

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-4 flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-500"><SearchX size={19} /></span>
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
