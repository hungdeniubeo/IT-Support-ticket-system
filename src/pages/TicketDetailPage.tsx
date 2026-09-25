import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Check, RefreshCw, Save, Trash2 } from 'lucide-react'
import { Link, useBlocker, useNavigate, useParams } from 'react-router'
import type { Ticket, TicketStatus } from '../domain/ticket'
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from '../domain/ticket'
import { Button } from '../components/Button'
import { SelectField, TextAreaField, TextField } from '../components/FormFields'
import { PageHeader } from '../components/PageHeader'
import { PriorityBadge, StatusBadge } from '../components/TicketBadges'
import { ActionMenu } from '../components/ActionMenu'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { AttachmentPanel } from '../components/AttachmentPanel'
import { TicketHistory } from '../components/TicketHistory'
import { useToast } from '../components/ToastProvider'
import { formatDate } from '../lib/dates'
import { getCategoryLabel, getPriorityLabel, getStatusLabel } from '../lib/labels'
import { ticketRepository } from '../services/activeTicketRepository'
import { attachmentRepository } from '../services/activeAttachmentRepository'

const editableFields = ['customer', 'title', 'description', 'category', 'priority', 'status', 'investigation', 'rootCause', 'solution', 'internalNotes'] as const
type EditableKey = (typeof editableFields)[number]
type NoteKey = 'investigation' | 'rootCause' | 'solution' | 'internalNotes'

const noteSections: Array<{ key: NoteKey; label: string; placeholder: string }> = [
  { key: 'investigation', label: 'Quá trình kiểm tra', placeholder: 'Ghi lại các bước đã kiểm tra, kết quả và dấu hiệu liên quan.' },
  { key: 'rootCause', label: 'Nguyên nhân', placeholder: 'Nguyên nhân chính gây ra vấn đề là gì?' },
  { key: 'solution', label: 'Cách xử lý', placeholder: 'Mô tả các bước đã khắc phục vấn đề.' },
  { key: 'internalNotes', label: 'Ghi chú nội bộ', placeholder: 'Lưu ý riêng để tham khảo khi gặp trường hợp tương tự.' },
]

function hasUnsavedChanges(current: Ticket | null, original: Ticket | null): boolean {
  return Boolean(current && original && editableFields.some((key) => current[key] !== original[key]))
}

export function TicketDetailPage() {
  const { ticketNumber } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [original, setOriginal] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const savingRef = useRef(false)
  const deletingRef = useRef(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [leaveDialog, setLeaveDialog] = useState(false)
  const [loadKey, setLoadKey] = useState(0)
  const dirty = hasUnsavedChanges(ticket, original)
  const blocker = useBlocker(dirty)

  useEffect(() => {
    if (blocker.state === 'blocked') setLeaveDialog(true)
    else setLeaveDialog(false)
  }, [blocker.state])

  useEffect(() => {
    if (!dirty) return
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [dirty])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setTicket(null)
    setOriginal(null)
    if (!ticketNumber) {
      setError('Không tìm thấy ticket này.')
      setLoading(false)
      return
    }
    void ticketRepository.get(ticketNumber)
      .then((found) => {
        if (cancelled) return
        setTicket(found ?? null)
        setOriginal(found ?? null)
        setError(found ? '' : `Không tìm thấy ticket ${ticketNumber}.`)
      })
      .catch(() => { if (!cancelled) setError('Không thể tải ticket này. Vui lòng thử lại.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [ticketNumber, loadKey])

  const update = useCallback(<K extends EditableKey>(key: K, value: Ticket[K]) => {
    setTicket((current) => current ? { ...current, [key]: value } : current)
  }, [])

  async function save(nextTicket = ticket) {
    if (!nextTicket || savingRef.current) return
    if (!nextTicket.customer.trim() || !nextTicket.title.trim()) {
      showToast('Vui lòng nhập khách hàng và tiêu đề ticket.', 'error')
      return
    }
    savingRef.current = true
    setSaving(true)
    try {
      const updated = await ticketRepository.update({ ...nextTicket, customer: nextTicket.customer.trim(), title: nextTicket.title.trim() })
      setTicket(updated)
      setOriginal(updated)
      window.dispatchEvent(new Event('it-tickets-changed'))
      showToast('Đã lưu thay đổi')
    } catch (saveError) {
      showToast(saveError instanceof Error ? saveError.message : 'Không thể lưu ticket.', 'error')
    } finally { savingRef.current = false; setSaving(false) }
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void save()
  }

  async function changeStatus(status: TicketStatus) {
    if (!ticket) return
    await save({ ...ticket, status })
  }

  async function deleteTicket() {
    if (!ticket || deletingRef.current) return
    deletingRef.current = true
    setDeleting(true)
    try {
      if (attachmentRepository) {
        const attachments = await attachmentRepository.list(ticket.id)
        for (const attachment of attachments) await attachmentRepository.delete(attachment)
      }
      await ticketRepository.delete(ticket.ticketNumber)
      window.dispatchEvent(new Event('it-tickets-changed'))
      showToast(`Đã xóa ticket ${ticket.ticketNumber}`)
      navigate('/tickets', { replace: true })
    } catch (deleteError) {
      showToast(deleteError instanceof Error ? deleteError.message : 'Không thể xóa ticket này.', 'error')
      deletingRef.current = false
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const actions = useMemo(() => ticket ? [
    ...(ticket.status !== 'resolved' ? [{ label: 'Đánh dấu đã xử lý', icon: <Check size={15} />, disabled: saving, onSelect: () => void changeStatus('resolved') }] : []),
    ...(ticket.status !== 'closed' ? [{ label: 'Đóng ticket', disabled: saving, onSelect: () => void changeStatus('closed') }] : []),
    { label: 'Xóa ticket', destructive: true, icon: <Trash2 size={15} />, disabled: deleting, onSelect: () => setConfirmDelete(true) },
  ] : [], [ticket, saving, deleting])

  if (loading) return <div className="max-w-5xl space-y-4" aria-label="Đang tải ticket" aria-busy="true"><div className="skeleton h-4 w-28 rounded" /><div className="skeleton h-9 w-72 rounded" /><div className="skeleton mt-8 h-56 rounded-md" /><div className="skeleton h-48 rounded-md" /></div>

  if (!ticket) return <div className="max-w-2xl"><PageHeader eyebrow="Quản lý yêu cầu" title="Không thể mở ticket" description={error || 'Ticket này có thể đã được xóa.'} action={error.includes('Không thể tải') ? <Button onClick={() => setLoadKey((value) => value + 1)}><RefreshCw size={15} />Thử lại</Button> : undefined} /><Link to="/tickets"><Button><ArrowLeft size={15} />Quay lại danh sách</Button></Link></div>

  return (
    <>
      <Link to="/tickets" className="mb-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors duration-150 hover:text-slate-800"><ArrowLeft size={15} />Quay lại danh sách ticket</Link>
      <PageHeader
        eyebrow={ticket.ticketNumber}
        title={ticket.title}
        description={`${ticket.customer} · Tạo ${formatDate(ticket.createdAt)} · Cập nhật ${formatDate(ticket.updatedAt)}`}
        action={<><Button type="submit" form="ticket-detail-form" variant="primary" disabled={!dirty || saving}><Save size={15} />{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</Button><ActionMenu items={actions} /></>}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2"><PriorityBadge priority={ticket.priority} /><StatusBadge status={ticket.status} />{dirty && <span className="text-xs font-medium text-amber-700">Có thay đổi chưa lưu</span>}</div>

      <form id="ticket-detail-form" onSubmit={handleSave} className="grid items-start gap-x-8 gap-y-6 xl:grid-cols-[minmax(0,1fr)_270px]">
        <section className="min-w-0 border-b border-slate-200 pb-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Thông tin ticket</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Khách hàng / Tiệm" required value={ticket.customer} onChange={(event) => update('customer', event.target.value)} />
            <TextField label="Tiêu đề vấn đề" required value={ticket.title} onChange={(event) => update('title', event.target.value)} />
            <SelectField label="Danh mục" required value={ticket.category} onChange={(value) => update('category', value as Ticket['category'])} options={TICKET_CATEGORIES} optionLabel={(value) => getCategoryLabel(value as Ticket['category'])} />
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Mức độ" required value={ticket.priority} onChange={(value) => update('priority', value as Ticket['priority'])} options={TICKET_PRIORITIES} optionLabel={(value) => getPriorityLabel(value as Ticket['priority'])} />
              <SelectField label="Trạng thái" value={ticket.status} onChange={(value) => update('status', value as Ticket['status'])} options={TICKET_STATUSES} optionLabel={(value) => getStatusLabel(value as Ticket['status'])} />
            </div>
          </div>
        </section>

        <aside className="order-last border-b border-slate-200 pb-5 xl:sticky xl:top-[76px] xl:order-none">
          <h2 className="text-sm font-semibold text-slate-900">Thời gian</h2>
          <dl className="mt-3 space-y-3">
            <div><dt className="text-[11px] font-medium text-slate-500">Ngày tạo</dt><dd className="mt-0.5 text-xs text-slate-700">{formatDate(ticket.createdAt)}</dd></div>
            <div><dt className="text-[11px] font-medium text-slate-500">Cập nhật lần cuối</dt><dd className="mt-0.5 text-xs text-slate-700">{formatDate(ticket.updatedAt)}</dd></div>
          </dl>
        </aside>

        <div className="min-w-0 space-y-5 xl:col-start-1 xl:row-start-2">
          <section className="border-b border-slate-200 pb-5"><TextAreaField label="Mô tả vấn đề" value={ticket.description} onChange={(event) => update('description', event.target.value)} placeholder="Mô tả vấn đề khách hàng gặp phải." className="min-h-24" /></section>
          {noteSections.map(({ key, label, placeholder }) => <section key={key} className="border-b border-slate-200 pb-5"><TextAreaField label={label} value={ticket[key]} onChange={(event) => update(key, event.target.value)} placeholder={placeholder} className="min-h-24" /></section>)}
          <AttachmentPanel key={ticket.id} ticketId={ticket.id} />
          <TicketHistory key={`${ticket.id}:${ticket.updatedAt}`} ticketNumber={ticket.ticketNumber} />
        </div>

        <aside className="xl:col-start-2 xl:row-start-2">
          <div className="sticky top-[76px] flex flex-col gap-3">
            <p className="text-xs leading-5 text-slate-500">Ghi lại các bước đã kiểm tra để dễ tra cứu khi gặp lỗi tương tự.</p>
            {dirty && <Button type="submit" variant="primary" disabled={saving}><Save size={15} />Lưu thay đổi</Button>}
            {saving && <span className="text-center text-xs text-slate-500">Đang lưu thay đổi…</span>}
          </div>
        </aside>
      </form>

      <ConfirmDialog open={confirmDelete} title={`Xóa ticket ${ticket.ticketNumber}?`} description="Ticket sau khi xóa sẽ không còn xuất hiện trong hệ thống." confirmLabel="Xóa ticket" destructive busy={deleting} onCancel={() => setConfirmDelete(false)} onConfirm={() => void deleteTicket()} />
      <ConfirmDialog open={leaveDialog} title="Rời khỏi ticket?" description="Bạn có thay đổi chưa lưu. Nếu rời khỏi trang, các thay đổi này sẽ bị mất." confirmLabel="Rời khỏi trang" cancelLabel="Tiếp tục chỉnh sửa" destructive onConfirm={() => { setLeaveDialog(false); blocker.proceed?.() }} onCancel={() => { setLeaveDialog(false); blocker.reset?.() }} />
    </>
  )
}
