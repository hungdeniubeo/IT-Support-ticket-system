import type { Ticket, TicketSummary } from '../domain/ticket'

export function summarizeTickets(tickets: readonly Ticket[]): TicketSummary {
  return tickets.reduce<TicketSummary>((summary, ticket) => {
    summary.total += 1
    if (ticket.status === 'new') summary.new += 1
    if (ticket.status === 'investigating') summary.investigating += 1
    if (ticket.status === 'waiting') summary.waiting += 1
    if (ticket.status === 'resolved' || ticket.status === 'closed') summary.completed += 1
    return summary
  }, { total: 0, new: 0, investigating: 0, waiting: 0, completed: 0 })
}

export function prioritizeAttentionTickets(tickets: readonly Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => {
    const rank = (ticket: Ticket) => ticket.priority === 'critical' ? 0 : ticket.status === 'waiting' ? 1 : 2
    return rank(a) - rank(b) || Date.parse(a.updatedAt) - Date.parse(b.updatedAt)
  })
}
