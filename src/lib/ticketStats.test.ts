import { describe, expect, it } from 'vitest'
import { seedTickets } from '../services/seedTickets'
import { summarizeTickets } from './ticketStats'

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
    const resolved = seedTickets.filter((ticket) => ticket.status === 'Resolved')
    const closed = seedTickets.filter((ticket) => ticket.status === 'Closed')
    expect(summarizeTickets([...resolved, ...closed])).toMatchObject({
      total: 2,
      completed: 2,
      new: 0,
      investigating: 0,
      waiting: 0,
    })
  })
})
