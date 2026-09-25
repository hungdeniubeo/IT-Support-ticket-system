import { TICKET_CATEGORIES, type Ticket, type TicketCategory, type TicketPriority, type TicketStatus } from './ticket'

const statusValues: Record<string, TicketStatus> = {
  new: 'new', investigating: 'investigating', waiting: 'waiting', resolved: 'resolved', closed: 'closed',
  New: 'new', Investigating: 'investigating', Waiting: 'waiting', Resolved: 'resolved', Closed: 'closed',
}

const priorityValues: Record<string, TicketPriority> = {
  low: 'low', medium: 'medium', high: 'high', critical: 'critical',
  Low: 'low', Medium: 'medium', High: 'high', Critical: 'critical',
}

export function normalizeTicket(value: unknown): Ticket | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  const stringFields = ['id', 'ticketNumber', 'customer', 'title', 'description', 'createdAt', 'updatedAt'] as const
  if (!stringFields.every((field) => typeof candidate[field] === 'string')) return null
  if (typeof candidate.category !== 'string' || !TICKET_CATEGORIES.some((category) => category === candidate.category)) return null
  if (typeof candidate.status !== 'string' || !statusValues[candidate.status]) return null
  if (typeof candidate.priority !== 'string' || !priorityValues[candidate.priority]) return null
  if (!/^IT-\d{3,}$/.test(candidate.ticketNumber as string)) return null
  if (Number.isNaN(Date.parse(candidate.createdAt as string)) || Number.isNaN(Date.parse(candidate.updatedAt as string))) return null

  return {
    id: candidate.id as string,
    ticketNumber: candidate.ticketNumber as string,
    customer: candidate.customer as string,
    title: candidate.title as string,
    description: candidate.description as string,
    category: candidate.category as TicketCategory,
    priority: priorityValues[candidate.priority as string]!,
    status: statusValues[candidate.status as string]!,
    investigation: typeof candidate.investigation === 'string' ? candidate.investigation : '',
    rootCause: typeof candidate.rootCause === 'string' ? candidate.rootCause : '',
    solution: typeof candidate.solution === 'string' ? candidate.solution : '',
    internalNotes: typeof candidate.internalNotes === 'string' ? candidate.internalNotes : '',
    createdAt: candidate.createdAt as string,
    updatedAt: candidate.updatedAt as string,
  }
}
