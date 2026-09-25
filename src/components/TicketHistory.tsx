import { useEffect, useState } from 'react'
import type { TicketHistoryEntry } from '../domain/ticket'
import { formatDate } from '../lib/dates'
import { getCategoryLabel, getPriorityLabel, getStatusLabel } from '../lib/labels'
import { ticketRepository } from '../services/activeTicketRepository'

const fieldLabels: Record<string, string> = {
  customer: 'Khách hàng / Tiệm', title: 'Tiêu đề', description: 'Mô tả', category: 'Danh mục',
  priority: 'Mức độ', status: 'Trạng thái', investigation: 'Quá trình kiểm tra',
  root_cause: 'Nguyên nhân', rootCause: 'Nguyên nhân', solution: 'Cách xử lý', internal_notes: 'Ghi chú nội bộ', internalNotes: 'Ghi chú nội bộ',
}

function valueLabel(field: string | null, value: string | null): string {
  if (value === null || value === '') return 'Trống'
  if (field === 'status') return getStatusLabel(value as Parameters<typeof getStatusLabel>[0])
  if (field === 'priority') return getPriorityLabel(value as Parameters<typeof getPriorityLabel>[0])
  if (field === 'category') return getCategoryLabel(value as Parameters<typeof getCategoryLabel>[0])
  return value
}

function description(entry: TicketHistoryEntry): string {
  if (entry.action === 'created') return 'Ticket được tạo'
  const field = fieldLabels[entry.fieldName ?? ''] ?? 'Thông tin'
  const oldValue = valueLabel(entry.fieldName, entry.oldValue)
  const newValue = valueLabel(entry.fieldName, entry.newValue)
  if (entry.action === 'resolved') return `Ticket đã được xử lý${entry.oldValue && entry.newValue ? `: ${oldValue} → ${newValue}` : ''}`
  if (entry.action === 'reopened') return 'Ticket được mở lại'
  if (entry.action === 'status_changed') return `${field} thay đổi: ${oldValue} → ${newValue}`
  if (entry.action === 'priority_changed') return `${field} thay đổi: ${oldValue} → ${newValue}`
  return `${field} đã được cập nhật`
}

export function TicketHistory({ ticketNumber }: { ticketNumber: string }) {
  const [entries, setEntries] = useState<TicketHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void ticketRepository.history(ticketNumber)
      .then((result) => { if (!cancelled) { setEntries(result); setError('') } })
      .catch(() => { if (!cancelled) setError('Không thể tải lịch sử hoạt động.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [ticketNumber])

  return (
    <section className="border-b border-slate-200 pb-5">
      <h2 className="text-sm font-semibold text-slate-900">Lịch sử hoạt động</h2>
      {loading ? <div className="mt-4 space-y-3" aria-label="Đang tải lịch sử">{[1, 2].map((item) => <div key={item} className="skeleton h-10 rounded" />)}</div>
        : error ? <p role="alert" className="mt-3 text-[13px] text-rose-700">{error}</p>
          : entries.length ? <ol className="mt-4 space-y-4">
            {entries.map((entry) => <li key={entry.id} className="relative flex gap-3 pl-0">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-slate-300" aria-hidden="true" />
              <div className="min-w-0 flex-1"><p className="text-[13px] font-medium text-slate-700">{description(entry)}</p><time dateTime={entry.createdAt} className="mt-0.5 block text-[11px] text-slate-400">{formatDate(entry.createdAt)}</time></div>
            </li>)}
          </ol> : <p className="mt-3 text-[13px] text-slate-500">Chưa có hoạt động nào.</p>}
    </section>
  )
}
