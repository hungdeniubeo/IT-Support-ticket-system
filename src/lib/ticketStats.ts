import type { Ticket } from '../domain/ticket'

export interface TicketSummary {
  total: number
  new: number
  investigating: number
  waiting: number
  completed: number
}

export function summarizeTickets(tickets: readonly Ticket[]): TicketSummary {
  return tickets.reduce<TicketSummary>((summary, ticket) => {
    summary.total += 1
    if (ticket.status === 'New') summary.new += 1
    if (ticket.status === 'Investigating') summary.investigating += 1
    if (ticket.status === 'Waiting') summary.waiting += 1
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') summary.completed += 1
    return summary
  }, { total: 0, new: 0, investigating: 0, waiting: 0, completed: 0 })
}
