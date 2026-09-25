import { useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ChevronDown, Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import type { NewTicket, TicketCategory, TicketPriority, TicketStatus } from '../domain/ticket'
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from '../domain/ticket'
import { Button } from '../components/Button'
import { PageHeader } from '../components/PageHeader'
import { SelectField, TextAreaField, TextField } from '../components/FormFields'
import { ticketRepository } from '../services/activeTicketRepository'
import { getCategoryLabel, getPriorityLabel, getStatusLabel } from '../lib/labels'
import { validateNewTicket } from '../domain/ticketValidation'
import { useToast } from '../components/ToastProvider'

interface TicketFormValues extends Omit<NewTicket, 'category' | 'priority'> {
  category: TicketCategory | ''
  priority: TicketPriority | ''
}

type FormErrors = Partial<Record<keyof TicketFormValues, string>>

const initialValues: TicketFormValues = {
  customer: '',
  title: '',
  description: '',
  category: '',
  priority: 'medium',
  status: 'new',
  investigation: '',
  rootCause: '',
  solution: '',
  internalNotes: '',
}

function isCategory(value: string): value is TicketCategory {
  return TICKET_CATEGORIES.some((category) => category === value)
}

function isPriority(value: string): value is TicketPriority {
  return TICKET_PRIORITIES.some((priority) => priority === value)
}

export function TicketCreatePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)

  function update<K extends keyof TicketFormValues>(key: K, value: TicketFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setFormError('')
  }

  function validate(): FormErrors {
    return validateNewTicket({
      ...values,
      category: values.category as TicketCategory,
      priority: values.priority as TicketPriority,
    } as NewTicket)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length || savingRef.current) return
    if (!isCategory(values.category) || !isPriority(values.priority)) return

    savingRef.current = true
    setSaving(true)
    setFormError('')
    try {
      const ticket = await ticketRepository.create({
        ...values,
        customer: values.customer.trim(),
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        priority: values.priority,
        status: values.status as TicketStatus,
      })
      showToast(`Đã tạo ticket ${ticket.ticketNumber}`)
      navigate(`/tickets/${ticket.ticketNumber}`)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Không thể lưu ticket. Vui lòng thử lại.')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <>
      <Link to="/tickets" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors duration-150 hover:text-slate-800"><ArrowLeft size={15} />Quay lại danh sách ticket</Link>
      <PageHeader eyebrow="Quản lý yêu cầu" title="Tạo ticket mới" description="Ghi lại thông tin cần thiết. Bạn có thể bổ sung cách xử lý sau." />

      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="max-w-[980px]">
        {formError && <p role="alert" className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p>}
        {Object.keys(errors).length > 0 && <p role="alert" className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Vui lòng kiểm tra các trường bắt buộc bên dưới.</p>}

        <section className="max-w-[980px] rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
            <TextField label="Khách hàng / Tiệm" required value={values.customer} onChange={(event) => update('customer', event.target.value)} placeholder="Ví dụ: Veganic Nail Spa" error={errors.customer} autoFocus />
            <TextField label="Tiêu đề vấn đề" required value={values.title} onChange={(event) => update('title', event.target.value)} placeholder="Tóm tắt ngắn gọn vấn đề" error={errors.title} />
            <SelectField label="Danh mục" required value={values.category} onChange={(value) => update('category', value as TicketCategory | '')} options={TICKET_CATEGORIES} optionLabel={(value) => getCategoryLabel(value as TicketCategory)} error={errors.category} />
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Mức độ ưu tiên" required value={values.priority} onChange={(value) => update('priority', value as TicketPriority | '')} options={TICKET_PRIORITIES} optionLabel={(value) => getPriorityLabel(value as TicketPriority)} error={errors.priority} />
              <SelectField label="Trạng thái" value={values.status} onChange={(value) => update('status', value as TicketStatus)} options={TICKET_STATUSES} optionLabel={(value) => getStatusLabel(value as TicketStatus)} />
            </div>
            <div className="sm:col-span-2">
              <TextAreaField label="Mô tả" value={values.description} onChange={(event) => update('description', event.target.value)} placeholder="Khách hàng gặp vấn đề gì? Ghi lại các bước và thông báo lỗi nếu có." error={errors.description} className="min-h-24" />
            </div>
          </div>
        </section>

        <details className="mt-3 max-w-[980px] rounded-md border border-slate-200 bg-white">
          <summary className="group flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-50 sm:px-5">
            Thêm ghi chú xử lý (không bắt buộc)<ChevronDown size={16} className="text-slate-400 transition-transform duration-150 group-open:rotate-180" />
          </summary>
          <div className="grid gap-4 border-t border-slate-200 p-4 sm:grid-cols-2 sm:p-5">
            <TextAreaField label="Quá trình kiểm tra" value={values.investigation} onChange={(event) => update('investigation', event.target.value)} placeholder="Các bước đã kiểm tra và kết quả" />
            <TextAreaField label="Nguyên nhân" value={values.rootCause} onChange={(event) => update('rootCause', event.target.value)} placeholder="Nguyên nhân gây ra vấn đề" />
            <TextAreaField label="Cách xử lý" value={values.solution} onChange={(event) => update('solution', event.target.value)} placeholder="Các bước đã khắc phục vấn đề" />
            <TextAreaField label="Ghi chú nội bộ" value={values.internalNotes} onChange={(event) => update('internalNotes', event.target.value)} placeholder="Lưu ý cho những lần hỗ trợ sau" />
          </div>
        </details>

        <div className="mt-5 flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500"><span className="text-rose-600">*</span> Trường bắt buộc</p>
          <div className="flex justify-end gap-2">
            <Link to="/tickets"><Button type="button">Hủy</Button></Link>
            <Button type="submit" variant="primary" disabled={saving}><Plus size={15} />{saving ? 'Đang tạo…' : 'Tạo ticket'}</Button>
          </div>
        </div>
      </form>
    </>
  )
}
