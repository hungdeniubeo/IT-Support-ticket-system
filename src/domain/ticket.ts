export const TICKET_CATEGORIES = [
  'Account / Login',
  'Nail360 / POS',
  'Clover / Payment',
  'Printer / Hardware',
  'Network',
  'Appointment / Booking',
  'Kiosk',
  'Report',
  'Configuration',
  'Bug',
  'How-to / Training',
  'Other',
] as const

export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const
export const TICKET_STATUSES = ['new', 'investigating', 'waiting', 'resolved', 'closed'] as const

export type TicketCategory = (typeof TICKET_CATEGORIES)[number]
export type TicketPriority = (typeof TICKET_PRIORITIES)[number]
export type TicketStatus = (typeof TICKET_STATUSES)[number]

export interface Ticket {
  id: string
  ticketNumber: string
  customer: string
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  investigation: string
  rootCause: string
  solution: string
  internalNotes: string
  createdAt: string
  updatedAt: string
}

export type NewTicket = Omit<Ticket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>

export interface TicketQuery {
  search?: string
  status?: TicketStatus
  priority?: TicketPriority
  category?: TicketCategory
  page?: number
  pageSize?: number
}

export interface TicketPage {
  tickets: Ticket[]
  total: number
  page: number
  pageSize: number
}

export interface TicketSummary {
  total: number
  new: number
  investigating: number
  waiting: number
  completed: number
}

export interface TicketDashboardSnapshot {
  summary: TicketSummary
  recentTickets: Ticket[]
  attentionTickets: Ticket[]
}

export type TicketHistoryAction = 'created' | 'updated' | 'status_changed' | 'priority_changed' | 'resolved' | 'reopened'

export interface TicketHistoryEntry {
  id: string
  ticketId: string
  userId: string | null
  action: TicketHistoryAction
  fieldName: string | null
  oldValue: string | null
  newValue: string | null
  createdAt: string
}

export interface TicketRepository {
  list(query?: TicketQuery): Promise<TicketPage>
  listAll(): Promise<Ticket[]>
  getDashboard(): Promise<TicketDashboardSnapshot>
  get(ticketNumber: string): Promise<Ticket | undefined>
  create(input: NewTicket): Promise<Ticket>
  update(ticket: Ticket): Promise<Ticket>
  delete(ticketNumber: string): Promise<void>
  history(ticketNumber: string): Promise<TicketHistoryEntry[]>
  importTickets(tickets: Ticket[]): Promise<{ imported: number; skipped: number; renumbered: number }>
}
