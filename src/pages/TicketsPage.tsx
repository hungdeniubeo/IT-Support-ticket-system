import { useMemo, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { TicketTable } from '../components/TicketTable'
import { useTickets } from '../hooks/useTickets'
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from '../domain/ticket'
import { getCategoryLabel, getPriorityLabel, getStatusLabel } from '../lib/labels'

const fieldClass = 'h-9 rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition-colors duration-150 focus:border-slate-400 focus:ring-2 focus:ring-slate-200'

export function TicketsPage() {
  const { tickets, loading, error } = useTickets()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [category, setCategory] = useState('')

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase()
    return tickets
      .filter((ticket) => !query || [ticket.ticketNumber, ticket.customer, ticket.title, ticket.description, getCategoryLabel(ticket.category), getPriorityLabel(ticket.priority), getStatusLabel(ticket.status)].some((value) => value.toLowerCase().includes(query)))
      .filter((ticket) => !status || ticket.status === status)
      .filter((ticket) => !priority || ticket.priority === priority)
      .filter((ticket) => !category || ticket.category === category)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [tickets, search, status, priority, category])

  const filtersActive = Boolean(search.trim() || status || priority || category)
  function clearFilters() {
    setSearch('')
    setStatus('')
    setPriority('')
    setCategory('')
  }

  return (
    <>
      <PageHeader
        eyebrow="Quản lý yêu cầu"
        title="Ticket hỗ trợ"
        description="Tìm kiếm, lọc và cập nhật các yêu cầu hỗ trợ của bạn."
        action={<Link to="/tickets/new"><Button variant="primary"><Plus size={16} />Tạo ticket</Button></Link>}
      />

      {error && <p role="alert" className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-800">Danh sách ticket</h2>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">{loading ? '—' : filteredTickets.length}</span>
            </div>
            {filtersActive && <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors duration-150 hover:text-slate-800"><X size={13} />Xóa bộ lọc</button>}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_165px_150px_210px]">
            <label className="relative block">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Tìm kiếm ticket..." aria-label="Tìm kiếm ticket" className={`${fieldClass} w-full pl-9`} />
            </label>
            <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Lọc theo trạng thái" className={fieldClass}>
              <option value="">Trạng thái</option>
              {TICKET_STATUSES.map((option) => <option key={option} value={option}>{getStatusLabel(option)}</option>)}
            </select>
            <select value={priority} onChange={(event) => setPriority(event.target.value)} aria-label="Lọc theo mức độ" className={fieldClass}>
              <option value="">Mức độ</option>
              {TICKET_PRIORITIES.map((option) => <option key={option} value={option}>{getPriorityLabel(option)}</option>)}
            </select>
            <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Lọc theo danh mục" className={fieldClass}>
              <option value="">Danh mục</option>
              {TICKET_CATEGORIES.map((option) => <option key={option} value={option}>{getCategoryLabel(option)}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5" aria-label="Đang tải ticket">{[1, 2, 3].map((row) => <div key={row} className="h-11 rounded bg-slate-100" />)}</div>
        ) : filteredTickets.length > 0 ? (
          <TicketTable tickets={filteredTickets} />
        ) : (
          <EmptyState
            title={tickets.length ? 'Không tìm thấy ticket phù hợp' : 'Chưa có ticket nào'}
            description={tickets.length ? 'Thử thay đổi từ khóa hoặc bộ lọc.' : 'Các ticket hỗ trợ bạn tạo sẽ xuất hiện tại đây.'}
            action={tickets.length
              ? <Button onClick={clearFilters} variant="secondary"><X size={15} />Xóa bộ lọc</Button>
              : <Link to="/tickets/new"><Button variant="primary"><Plus size={16} />Tạo ticket</Button></Link>}
          />
        )}
      </section>
      <p className="mt-3 text-xs text-slate-500">Ticket được sắp xếp mới nhất trước. Chọn một dòng để xem chi tiết.</p>
    </>
  )
}
