import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Search, X } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { TicketTable } from '../components/TicketTable'
import { useTickets } from '../hooks/useTickets'
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from '../domain/ticket'
import { getCategoryLabel, getPriorityLabel, getStatusLabel } from '../lib/labels'

const PAGE_SIZE = 25
const controlClass = 'h-10 rounded-md border border-slate-200 bg-white text-[13px] text-slate-700 outline-none transition-colors duration-150 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200'
const toOptions = (values: readonly string[], label: (value: never) => string) => values.map((value) => ({ value, label: label(value as never) }))

export function TicketsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => window.clearTimeout(timeout)
  }, [search])

  useEffect(() => { setPage(1) }, [debouncedSearch, status, priority, category])

  const { tickets, total, loading, error, refresh } = useTickets({
    search: debouncedSearch || undefined,
    status: status ? status as (typeof TICKET_STATUSES)[number] : undefined,
    priority: priority ? priority as (typeof TICKET_PRIORITIES)[number] : undefined,
    category: category ? category as (typeof TICKET_CATEGORIES)[number] : undefined,
    page,
    pageSize: PAGE_SIZE,
  })

  const filtersActive = Boolean(search.trim() || status || priority || category)
  function clearFilters() {
    setSearch('')
    setDebouncedSearch('')
    setStatus('')
    setPriority('')
    setCategory('')
    setPage(1)
  }

  return (
    <>
      <PageHeader
        eyebrow="Quản lý yêu cầu"
        title="Ticket hỗ trợ"
        description="Theo dõi, tìm kiếm và cập nhật các yêu cầu hỗ trợ IT."
        action={<Link to="/tickets/new"><Button variant="primary"><Plus size={16} />Tạo ticket</Button></Link>}
      />

      {error && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><Button onClick={refresh}><RefreshCw size={14} />Thử lại</Button></div>}

      <section className="rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-800">Danh sách ticket</h2>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600" aria-live="polite">{loading ? '…' : `${total} ticket`}</span>
            </div>
            {filtersActive && <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors duration-150 hover:text-slate-800"><X size={13} />Xóa bộ lọc</button>}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_165px_150px_210px]">
            <label className={`relative flex items-center ${controlClass}`}>
              <Search size={16} className="pointer-events-none absolute left-3 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Tìm mã, vấn đề hoặc khách hàng…" aria-label="Tìm mã ticket, vấn đề hoặc khách hàng" className="h-full w-full rounded-md bg-transparent pl-9 pr-3 outline-none placeholder:text-slate-400" />
            </label>
            <div className="h-10"><Select value={status} onChange={(value) => setStatus(value)} options={[{ value: '', label: 'Tất cả trạng thái' }, ...toOptions(TICKET_STATUSES, getStatusLabel as (value: never) => string)]} placeholder="Tất cả trạng thái" /></div>
            <div className="h-10"><Select value={priority} onChange={(value) => setPriority(value)} options={[{ value: '', label: 'Mọi mức độ' }, ...toOptions(TICKET_PRIORITIES, getPriorityLabel as (value: never) => string)]} placeholder="Mọi mức độ" /></div>
            <div className="h-10"><Select value={category} onChange={(value) => setCategory(value)} options={[{ value: '', label: 'Mọi danh mục' }, ...toOptions(TICKET_CATEGORIES, getCategoryLabel as (value: never) => string)]} placeholder="Mọi danh mục" /></div>
          </div>
          {search !== debouncedSearch && <p className="text-[11px] text-slate-400" aria-live="polite">Đang tìm kiếm…</p>}
        </div>

        {loading ? (
          <div className="space-y-3 p-5" aria-label="Đang tải ticket" aria-busy="true">{[1, 2, 3, 4].map((row) => <div key={row} className="skeleton h-10 rounded" />)}</div>
        ) : error && tickets.length === 0 ? (
          <EmptyState title="Không thể tải danh sách ticket" description="Kiểm tra kết nối rồi thử lại." action={<Button onClick={refresh}><RefreshCw size={14} />Thử lại</Button>} />
        ) : tickets.length > 0 ? (
          <>
            <TicketTable tickets={tickets} />
            <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} trong {total} ticket</span>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button variant="secondary" className="h-8 px-2.5" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={15} />Trước</Button>
                <span className="min-w-16 text-center">Trang {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>
                <Button variant="secondary" className="h-8 px-2.5" disabled={page * PAGE_SIZE >= total} onClick={() => setPage((current) => current + 1)}>Sau<ChevronRight size={15} /></Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            title={filtersActive ? 'Không tìm thấy ticket phù hợp' : 'Chưa có ticket nào'}
            description={filtersActive ? 'Thử thay đổi từ khóa hoặc bộ lọc.' : 'Các yêu cầu hỗ trợ bạn tạo sẽ xuất hiện tại đây.'}
            action={filtersActive
              ? <Button onClick={clearFilters} variant="secondary"><X size={15} />Xóa bộ lọc</Button>
              : <Link to="/tickets/new"><Button variant="primary"><Plus size={16} />Tạo ticket đầu tiên</Button></Link>}
          />
        )}
      </section>
    </>
  )
}
