import { ArrowRight, CircleCheck, CircleDot, Clock3, ClipboardList, Plus, RefreshCw, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/Button'
import { TicketTable } from '../components/TicketTable'
import { PriorityBadge, StatusBadge } from '../components/TicketBadges'
import { useDashboard } from '../hooks/useDashboard'
import { formatDate } from '../lib/dates'

export function DashboardPage() {
  const { summary, recentTickets, attentionTickets, loading, error, refresh } = useDashboard()
  const stats = [
    { label: 'Tổng ticket', value: summary.total, icon: ClipboardList, tone: 'bg-slate-100 text-slate-600' },
    { label: 'Mới', value: summary.new, icon: CircleDot, tone: 'bg-sky-50 text-sky-700' },
    { label: 'Đang xử lý', value: summary.investigating, icon: CircleDot, tone: 'bg-blue-50 text-blue-700' },
    { label: 'Đang chờ', value: summary.waiting, icon: Clock3, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Hoàn thành', value: summary.completed, icon: CircleCheck, tone: 'bg-emerald-50 text-emerald-700' },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Không gian hỗ trợ"
        title="Tổng quan"
        description="Theo dõi tình trạng các yêu cầu hỗ trợ IT của bạn."
        action={<Link to="/tickets/new"><Button variant="primary"><Plus size={16} />Tạo ticket</Button></Link>}
      />

      {error && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><Button onClick={refresh}><RefreshCw size={14} />Thử lại</Button></div>}

      <section aria-label="Thống kê ticket" className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="flex min-h-[72px] items-center gap-3 rounded-md border border-slate-200 bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-md ${tone}`}><Icon size={17} strokeWidth={1.8} /></span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-slate-500">{label}</p>
              {loading ? <div className="skeleton mt-2 h-5 w-10 rounded" /> : <p className="mt-1 text-xl font-semibold leading-none tracking-tight text-slate-900">{error ? '—' : value}</p>}
            </div>
          </div>
        ))}
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md bg-amber-50 text-amber-700"><TriangleAlert size={16} /></span>
            <div><h2 className="text-sm font-semibold text-slate-900">Ticket cần chú ý</h2><p className="mt-0.5 text-xs text-slate-500">Ticket khẩn cấp, đang chờ hoặc chưa cập nhật lâu</p></div>
          </div>
          <Link to="/tickets" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors duration-150 hover:text-slate-900">Tất cả <ArrowRight size={14} /></Link>
        </div>
        {loading ? <div className="space-y-3 p-4" aria-label="Đang tải ticket cần chú ý">{[1, 2].map((row) => <div key={row} className="skeleton h-12 rounded" />)}</div> : error ? <p className="px-4 py-5 text-[13px] text-slate-500">Chưa thể tải dữ liệu ticket cần chú ý.</p> : attentionTickets.length ? (
          <ul className="divide-y divide-slate-100">
            {attentionTickets.map((ticket) => <li key={ticket.id}>
              <Link to={`/tickets/${ticket.ticketNumber}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors duration-150 hover:bg-slate-50 sm:flex-nowrap">
                <span className="w-16 shrink-0 font-mono text-xs font-semibold text-slate-600">{ticket.ticketNumber}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-800">{ticket.title}<span className="ml-2 font-normal text-slate-500">{ticket.customer}</span></span>
                <PriorityBadge priority={ticket.priority} /><StatusBadge status={ticket.status} />
                <span className="w-28 shrink-0 text-right text-[11px] text-slate-400">{formatDate(ticket.updatedAt, false)}</span>
              </Link>
            </li>)}
          </ul>
        ) : <p className="px-4 py-5 text-[13px] text-slate-500">Không có ticket nào cần chú ý.</p>}
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3.5">
          <div><h2 className="text-sm font-semibold text-slate-900">Ticket gần đây</h2><p className="mt-0.5 text-xs text-slate-500">Các yêu cầu được cập nhật gần nhất</p></div>
          <Link to="/tickets" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors duration-150 hover:text-slate-900">Xem tất cả <ArrowRight size={14} /></Link>
        </div>
        {loading ? <div className="space-y-3 p-5" aria-label="Đang tải ticket gần đây">{[1, 2, 3].map((row) => <div key={row} className="skeleton h-10 rounded" />)}</div> : error ? <p className="px-4 py-5 text-[13px] text-slate-500">Chưa thể tải ticket gần đây.</p> : recentTickets.length ? <TicketTable tickets={recentTickets} variant="dashboard" /> : (
          <EmptyState title="Chưa có ticket nào" description="Các yêu cầu hỗ trợ bạn tạo sẽ xuất hiện tại đây." action={<Link to="/tickets/new"><Button variant="primary"><Plus size={16} />Tạo ticket đầu tiên</Button></Link>} />
        )}
      </section>
    </>
  )
}
