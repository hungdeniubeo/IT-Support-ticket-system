import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, Check, Save, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import type { Ticket } from '../domain/ticket'
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from '../domain/ticket'
import { Button } from '../components/Button'
import { SelectField, TextAreaField, TextField } from '../components/FormFields'
import { PageHeader } from '../components/PageHeader'
import { PriorityBadge, StatusBadge } from '../components/TicketBadges'
import { formatDate } from '../lib/dates'
import { getCategoryLabel, getPriorityLabel, getStatusLabel } from '../lib/labels'
import { ticketRepository } from '../services/ticketRepository'

type EditableKey = 'customer' | 'title' | 'description' | 'category' | 'priority' | 'status' | 'investigation' | 'rootCause' | 'solution' | 'internalNotes'
type NoteKey = 'investigation' | 'rootCause' | 'solution' | 'internalNotes'

const noteSections: Array<{ key: NoteKey; label: string; placeholder: string }> = [
  { key: 'investigation', label: 'Quá trình kiểm tra', placeholder: 'Ghi lại các bước đã kiểm tra, kết quả và dấu hiệu liên quan.' },
  { key: 'rootCause', label: 'Nguyên nhân', placeholder: 'Nguyên nhân chính gây ra vấn đề là gì?' },
  { key: 'solution', label: 'Cách xử lý', placeholder: 'Mô tả các bước đã khắc phục vấn đề.' },
  { key: 'internalNotes', label: 'Ghi chú nội bộ', placeholder: 'Lưu ý riêng để tham khảo khi gặp trường hợp tương tự.' },
]

export function TicketDetailPage() {
  const { ticketNumber } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    if (!ticketNumber) {
      setError('Không tìm thấy ticket này.')
      setLoading(false)
      return
    }
    void ticketRepository.get(ticketNumber)
      .then((found) => {
        if (cancelled) return
        setTicket(found ?? null)
        setError(found ? '' : `Không tìm thấy ticket ${ticketNumber}.`)
      })
      .catch(() => {
        if (!cancelled) setError('Không thể tải ticket này.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [ticketNumber])

  function update<K extends EditableKey>(key: K, value: Ticket[K]) {
    setTicket((current) => current ? { ...current, [key]: value } : current)
    setSaved(false)
    setSaveError('')
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ticket) return
    setSaving(true)
    setSaved(false)
    setSaveError('')
    try {
      const updated = await ticketRepository.update(ticket)
      setTicket(updated)
      setSaved(true)
    } catch {
      setSaveError('Không thể lưu thay đổi. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!ticket) return
    setDeleting(true)
    try {
      await ticketRepository.delete(ticket.ticketNumber)
      navigate('/tickets')
    } catch {
      setSaveError('Không thể xóa ticket này. Vui lòng thử lại.')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (loading) {
    return <div className="max-w-4xl space-y-4" aria-label="Đang tải ticket"><div className="h-4 w-32 rounded bg-slate-200" /><div className="h-10 w-60 rounded bg-slate-200" /><div className="mt-8 h-72 rounded-md bg-white" /></div>
  }

  if (!ticket) {
    return (
      <div className="max-w-2xl">
        <PageHeader eyebrow="Quản lý yêu cầu" title="Không thể mở ticket" description={error || 'Ticket này có thể đã được xóa.'} />
        <Link to="/tickets"><Button><ArrowLeft size={15} />Quay lại danh sách</Button></Link>
      </div>
    )
  }

  return (
    <>
      <Link to="/tickets" className="mb-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors duration-150 hover:text-slate-800"><ArrowLeft size={15} />Quay lại danh sách ticket</Link>
      <PageHeader
        eyebrow={ticket.ticketNumber}
        title={ticket.title}
        description={`Khách hàng: ${ticket.customer} · Ngày tạo: ${formatDate(ticket.createdAt)} · Cập nhật: ${formatDate(ticket.updatedAt)}`}
        action={<><PriorityBadge priority={ticket.priority} /><StatusBadge status={ticket.status} /></>}
      />

      {saveError && <p role="alert" className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{saveError}</p>}

      <form onSubmit={(event) => void handleSave(event)} className="grid items-start gap-x-7 gap-y-4 xl:grid-cols-[minmax(0,1fr)_250px]">
        <section className="min-w-0 rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
          <div className="border-b border-slate-200 px-4 py-3.5 sm:px-5">
            <h2 className="text-sm font-semibold text-slate-900">Thông tin ticket</h2>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
            <TextField label="Khách hàng / Tiệm" required value={ticket.customer} onChange={(event) => update('customer', event.target.value)} />
            <TextField label="Tiêu đề vấn đề" required value={ticket.title} onChange={(event) => update('title', event.target.value)} />
            <SelectField label="Danh mục" required value={ticket.category} onChange={(event) => update('category', event.target.value as Ticket['category'])} options={TICKET_CATEGORIES} optionLabel={(value) => getCategoryLabel(value as Ticket['category'])} />
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Mức độ" required value={ticket.priority} onChange={(event) => update('priority', event.target.value as Ticket['priority'])} options={TICKET_PRIORITIES} optionLabel={(value) => getPriorityLabel(value as Ticket['priority'])} />
              <SelectField label="Trạng thái" value={ticket.status} onChange={(event) => update('status', event.target.value as Ticket['status'])} options={TICKET_STATUSES} optionLabel={(value) => getStatusLabel(value as Ticket['status'])} />
            </div>
          </div>
        </section>

        <aside className="order-last flex flex-col gap-3 xl:sticky xl:top-[72px] xl:order-none">
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
            <h2 className="text-xs font-semibold text-slate-800">Thời gian</h2>
            <dl className="mt-3 space-y-3">
              <div><dt className="text-[11px] font-medium text-slate-500">Ngày tạo</dt><dd className="mt-0.5 text-xs text-slate-700">{formatDate(ticket.createdAt)}</dd></div>
              <div><dt className="text-[11px] font-medium text-slate-500">Cập nhật lần cuối</dt><dd className="mt-0.5 text-xs text-slate-700">{formatDate(ticket.updatedAt)}</dd></div>
            </dl>
          </div>
          <p className="px-1 text-xs leading-5 text-slate-500">Ghi lại các bước đã kiểm tra để dễ tra cứu khi gặp lỗi tương tự.</p>
        </aside>

        <div className="min-w-0 space-y-4 xl:col-start-1 xl:row-start-2">
          <section className="border-b border-slate-200 pb-4">
            <TextAreaField label="Mô tả vấn đề" required value={ticket.description} onChange={(event) => update('description', event.target.value)} placeholder="Mô tả vấn đề khách hàng gặp phải." className="min-h-24" />
          </section>
          {noteSections.map(({ key, label, placeholder }) => (
            <section key={key} className="border-b border-slate-200 pb-4 last:border-b-0">
              <TextAreaField label={label} value={ticket[key]} onChange={(event) => update(key, event.target.value)} placeholder={placeholder} className="min-h-24" />
            </section>
          ))}

          <div className="sticky bottom-0 flex flex-col-reverse items-start justify-between gap-3 border-t border-slate-200 bg-[#f5f6f8]/95 py-3 sm:flex-row sm:items-center">
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)} className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"><Trash2 size={15} />Xóa ticket</Button>
            <div className="flex items-center gap-3 self-end">
              {saved && <span role="status" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><Check size={14} />Đã lưu thay đổi</span>}
              <Button type="submit" variant="primary" disabled={saving}><Save size={15} />{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</Button>
            </div>
          </div>
        </div>
      </form>

      {confirmDelete && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 p-4 transition-opacity duration-150" role="presentation" onClick={() => setConfirmDelete(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="delete-title" className="w-full max-w-md rounded-md border border-slate-200 bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex size-9 items-center justify-center rounded-md bg-rose-50 text-rose-700"><Trash2 size={17} /></div>
            <h2 id="delete-title" className="mt-4 text-base font-semibold text-slate-900">Xóa ticket {ticket.ticketNumber}?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Ticket và toàn bộ ghi chú xử lý sẽ bị xóa khỏi thiết bị này. Bạn không thể hoàn tác thao tác này.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" onClick={() => setConfirmDelete(false)} disabled={deleting}>Hủy</Button>
              <Button type="button" variant="danger" onClick={() => void handleDelete()} disabled={deleting}><Trash2 size={15} />{deleting ? 'Đang xóa…' : 'Xóa ticket'}</Button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
