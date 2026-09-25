import type { Ticket, TicketQuery } from '../domain/ticket'

export function filterTickets(tickets: readonly Ticket[], query: TicketQuery = {}): Ticket[] {
  const search = query.search?.trim().toLocaleLowerCase('vi-VN') ?? ''

  return tickets
    .filter((ticket) => !search || [ticket.ticketNumber, ticket.title, ticket.customer]
      .some((value) => value.toLocaleLowerCase('vi-VN').includes(search)))
    .filter((ticket) => !query.status || ticket.status === query.status)
    .filter((ticket) => !query.priority || ticket.priority === query.priority)
    .filter((ticket) => !query.category || ticket.category === query.category)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.ticketNumber.localeCompare(a.ticketNumber))
}

export function buildTicketSearchFilter(search: string): string {
  const escaped = search.trim().replace(/[\\%_"]/g, '\\$&')
  const pattern = `"%${escaped}%"`
  return ['ticket_number', 'title', 'customer']
    .map((field) => `${field}.ilike.${pattern}`)
    .join(',')
}
