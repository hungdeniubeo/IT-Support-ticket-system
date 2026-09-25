import { TICKET_CATEGORIES, TICKET_PRIORITIES, type NewTicket } from './ticket'

export type TicketValidationErrors = Partial<Record<keyof NewTicket, string>>

export function validateNewTicket(input: NewTicket): TicketValidationErrors {
  const errors: TicketValidationErrors = {}
  if (!input.customer.trim()) errors.customer = 'Nhập tên khách hàng hoặc tiệm.'
  if (!input.title.trim()) errors.title = 'Nhập tiêu đề ngắn gọn cho vấn đề.'
  if (!TICKET_CATEGORIES.includes(input.category)) errors.category = 'Chọn danh mục ticket.'
  if (!TICKET_PRIORITIES.includes(input.priority)) errors.priority = 'Chọn mức độ ưu tiên.'
  return errors
}

const attachmentTypes: Record<string, readonly string[]> = {
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  webp: ['image/webp'],
  pdf: ['application/pdf'],
  txt: ['text/plain'],
  log: ['text/plain', 'text/x-log', 'application/octet-stream'],
}

export function validateAttachment(file: { name: string; type: string; size: number }): string | null {
  if (file.size <= 0) return 'Tệp đính kèm không được trống.'
  if (file.size > 10 * 1024 * 1024) return 'Tệp đính kèm không được vượt quá 10 MB.'

  const extension = file.name.split('.').at(-1)?.toLocaleLowerCase('en-US') ?? ''
  const allowedTypes = attachmentTypes[extension]
  if (!allowedTypes) return 'Chỉ hỗ trợ JPG, PNG, WebP, PDF, TXT và LOG.'
  if (file.type && !allowedTypes.includes(file.type)) return 'Định dạng tệp không khớp với phần mở rộng.'
  return null
}
