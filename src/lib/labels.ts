import type { TicketCategory, TicketPriority, TicketStatus } from '../domain/ticket'

const statusLabels: Record<TicketStatus, string> = {
  New: 'Mới',
  Investigating: 'Đang kiểm tra',
  Waiting: 'Đang chờ',
  Resolved: 'Đã xử lý',
  Closed: 'Đã đóng',
}

const priorityLabels: Record<TicketPriority, string> = {
  Low: 'Thấp',
  Medium: 'Trung bình',
  High: 'Cao',
  Critical: 'Khẩn cấp',
}

const categoryLabels: Record<TicketCategory, string> = {
  'Account / Login': 'Tài khoản / Đăng nhập',
  'Nail360 / POS': 'Nail360 / POS',
  'Clover / Payment': 'Clover / Thanh toán',
  'Printer / Hardware': 'Máy in / Phần cứng',
  Network: 'Mạng',
  'Appointment / Booking': 'Lịch hẹn / Đặt lịch',
  Kiosk: 'Kiosk',
  Report: 'Báo cáo',
  Configuration: 'Cấu hình',
  Bug: 'Lỗi',
  'How-to / Training': 'Hướng dẫn / Đào tạo',
  Other: 'Khác',
}

export function getStatusLabel(status: TicketStatus): string {
  return statusLabels[status]
}

export function getPriorityLabel(priority: TicketPriority): string {
  return priorityLabels[priority]
}

export function getCategoryLabel(category: TicketCategory): string {
  return categoryLabels[category]
}
