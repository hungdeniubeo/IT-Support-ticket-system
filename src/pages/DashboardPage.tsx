import { useMemo } from 'react'
import { ArrowRight, CircleCheck, CircleDot, Clock3, ClipboardList, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/Button'
import { TicketTable } from '../components/TicketTable'
import { useTickets } from '../hooks/useTickets'
import { summarizeTickets } from '../lib/ticketStats'

export function DashboardPage() {
  const { tickets, loading, error } = useTickets()
  const counts = useMemo(() => summarizeTickets(tickets), [tickets])
  const stats = [
    { label: 'Tổng ticket', value: counts.total, icon: ClipboardList, tone: 'bg-slate-100 text-slate-600' },
    { label: 'Ticket mới', value: counts.new, icon: CircleDot, tone: 'bg-sky-50 text-sky-700' },
    { label: 'Đang xử lý', value: counts.investigating, icon: CircleDot, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Đang chờ', value: counts.waiting, icon: Clock3, tone: 'bg-violet-50 text-violet-700' },
    { label: 'Đã hoàn thành', value: counts.completed, icon: CircleCheck, tone: 'bg-emerald-50 text-emerald-700' },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Không gian hỗ trợ"
        title="Tổng quan"
        description="Theo dõi và quản lý các yêu cầu hỗ trợ IT của bạn."
        action={<Link to="/tickets/new"><Button variant="primary"><Plus size={16} />Tạo ticket</Button></Link>}
      />

      {error && <p role="alert" className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <section aria-label="Thống kê ticket" className="mb-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3.5 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-md ${tone}`}><Icon size={17} strokeWidth={1.8} /></span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-semibold leading-none tracking-tight text-slate-900">{loading ? '—' : value}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Ticket gần đây</h2>
            <p className="mt-0.5 text-xs text-slate-500">Các yêu cầu hỗ trợ mới nhất</p>
          </div>
          <Link to="/tickets" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors duration-150 hover:text-slate-900">
            Xem tất cả <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3 p-5" aria-label="Đang tải ticket">
            {[1, 2, 3].map((row) => <div key={row} className="h-11 rounded bg-slate-100" />)}
          </div>
        ) : tickets.length ? (
          <TicketTable tickets={tickets.slice(0, 6)} variant="dashboard" />
        ) : (
          <EmptyState
            title="Chưa có ticket nào"
            description="Các ticket hỗ trợ bạn tạo sẽ xuất hiện tại đây."
            action={<Link to="/tickets/new"><Button variant="primary"><Plus size={16} />Tạo ticket đầu tiên</Button></Link>}
          />
        )}
      </section>
    </>
  )
}
