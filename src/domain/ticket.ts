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

export const TICKET_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const
export const TICKET_STATUSES = ['New', 'Investigating', 'Waiting', 'Resolved', 'Closed'] as const

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

export interface TicketRepository {
  list(): Promise<Ticket[]>
  get(ticketNumber: string): Promise<Ticket | undefined>
  create(input: NewTicket): Promise<Ticket>
  update(ticket: Ticket): Promise<Ticket>
  delete(ticketNumber: string): Promise<void>
}
