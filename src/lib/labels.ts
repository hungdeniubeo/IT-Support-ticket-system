import type { TicketCategory, TicketPriority, TicketStatus } from '../domain/ticket'

const statusLabels: Record<TicketStatus, string> = {
  new: 'Mới',
  investigating: 'Đang kiểm tra',
  waiting: 'Đang chờ',
  resolved: 'Đã xử lý',
  closed: 'Đã đóng',
}

const priorityLabels: Record<TicketPriority, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  critical: 'Khẩn cấp',
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
