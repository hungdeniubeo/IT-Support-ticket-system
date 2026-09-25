import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description: string
  eyebrow?: string
  action?: ReactNode
}

export function PageHeader({ title, description, eyebrow, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        {eyebrow && <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">{eyebrow}</p>}
        <h1 className="text-[1.65rem] font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500">{description}</p>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}
