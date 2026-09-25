import { describe, expect, it } from 'vitest'
import { seedTickets } from '../services/seedTickets'
import { prioritizeAttentionTickets, summarizeTickets } from './ticketStats'

describe('ticket dashboard summary', () => {
  it('counts each workflow state from the actual ticket records', () => {
    expect(summarizeTickets(seedTickets)).toEqual({
      total: 5,
      new: 1,
      investigating: 1,
      waiting: 1,
      completed: 2,
    })
  })

  it('updates the completed total for resolved and closed tickets', () => {
    const resolved = seedTickets.filter((ticket) => ticket.status === 'resolved')
    const closed = seedTickets.filter((ticket) => ticket.status === 'closed')
    expect(summarizeTickets([...resolved, ...closed])).toMatchObject({
      total: 2,
      completed: 2,
      new: 0,
      investigating: 0,
      waiting: 0,
    })
  })

  it('shows critical, waiting, and longest-stale work first', () => {
    const critical = { ...seedTickets[0]!, priority: 'critical' as const, status: 'new' as const, updatedAt: '2026-09-20T00:00:00Z' }
    const waiting = { ...seedTickets[1]!, priority: 'low' as const, status: 'waiting' as const, updatedAt: '2026-09-10T00:00:00Z' }
    const stale = { ...seedTickets[2]!, priority: 'medium' as const, status: 'investigating' as const, updatedAt: '2026-09-01T00:00:00Z' }

    expect(prioritizeAttentionTickets([stale, waiting, critical]).map((ticket) => ticket.id)).toEqual([
      critical.id,
      waiting.id,
      stale.id,
    ])
  })
})
