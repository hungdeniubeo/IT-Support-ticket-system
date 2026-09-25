import type { TicketPriority, TicketStatus } from '../domain/ticket'
import { getPriorityLabel, getStatusLabel } from '../lib/labels'

const statusStyles: Record<TicketStatus, string> = {
  New: 'bg-sky-50 text-sky-700 ring-sky-200',
  Investigating: 'bg-amber-50 text-amber-800 ring-amber-200',
  Waiting: 'bg-violet-50 text-violet-700 ring-violet-200',
  Resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Closed: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const priorityStyles: Record<TicketPriority, string> = {
  Low: 'bg-slate-100 text-slate-600 ring-slate-200',
  Medium: 'bg-blue-50 text-blue-700 ring-blue-200',
  High: 'bg-orange-50 text-orange-800 ring-orange-200',
  Critical: 'bg-rose-50 text-rose-700 ring-rose-200',
}

function Badge({ label, className }: { label: string; className: string }) {
  return <span className={`inline-flex items-center rounded px-2 py-1 text-[11px] font-semibold leading-none ring-1 ring-inset transition-colors duration-150 ${className}`}>{label}</span>
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <Badge label={getStatusLabel(status)} className={statusStyles[status]} />
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <Badge label={getPriorityLabel(priority)} className={priorityStyles[priority]} />
}
