import { useNavigate } from 'react-router'
import type { Ticket } from '../domain/ticket'
import { formatDate } from '../lib/dates'
import { getCategoryLabel } from '../lib/labels'
import { PriorityBadge, StatusBadge } from './TicketBadges'

interface TicketTableProps {
  tickets: Ticket[]
  variant?: 'dashboard' | 'tickets'
}

export function TicketTable({ tickets, variant = 'tickets' }: TicketTableProps) {
  const navigate = useNavigate()
  const isDashboard = variant === 'dashboard'

  function openTicket(ticket: Ticket) {
    navigate(`/tickets/${ticket.ticketNumber}`)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/70">
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Mã ticket</th>
            {isDashboard && <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Vấn đề</th>}
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Khách hàng / Tiệm</th>
            {!isDashboard && <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Vấn đề</th>}
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Danh mục</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Mức độ</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Trạng thái</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cập nhật</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="cursor-pointer transition-colors duration-150 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-300"
              onClick={() => openTicket(ticket)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openTicket(ticket)
                }
              }}
              tabIndex={0}
              role="link"
              aria-label={`Mở ${ticket.ticketNumber}: ${ticket.title}`}
            >
              <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs font-semibold text-slate-700">{ticket.ticketNumber}</td>
              {isDashboard && <td className="max-w-64 px-4 py-3.5"><span className="block truncate text-sm font-medium text-slate-800">{ticket.title}</span></td>}
              <td className="max-w-44 truncate px-4 py-3.5 text-sm font-medium text-slate-800">{ticket.customer}</td>
              {!isDashboard && <td className="max-w-64 px-4 py-3.5"><span className="block truncate text-sm font-medium text-slate-800">{ticket.title}</span></td>}
              <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-600">{getCategoryLabel(ticket.category)}</td>
              <td className="whitespace-nowrap px-4 py-3.5"><PriorityBadge priority={ticket.priority} /></td>
              <td className="whitespace-nowrap px-4 py-3.5"><StatusBadge status={ticket.status} /></td>
              <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">{formatDate(ticket.updatedAt, false)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
