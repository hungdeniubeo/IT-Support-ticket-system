import { beforeEach, describe, expect, it } from 'vitest'
import { createLocalTicketRepository } from './ticketRepository'

type RepositoryWithActivity = {
  history?: (ticketNumber: string) => Promise<Array<{ action: string; fieldName: string | null }>>
  importTickets?: (tickets: Array<Record<string, unknown>>) => Promise<{ imported: number; skipped: number; renumbered: number }>
  list: (query?: { page?: number; pageSize?: number }) => Promise<{ tickets: Array<Record<string, unknown>>; total: number }>
  create: (input: Record<string, unknown>) => Promise<Record<string, unknown>>
  update: (ticket: Record<string, unknown>) => Promise<Record<string, unknown>>
  getDashboard?: () => Promise<{ summary: { total: number }; recentTickets: Array<{ ticketNumber: string }>; attentionTickets: Array<{ ticketNumber: string }> }>
}

describe('local ticket repository activity and import', () => {
  beforeEach(() => localStorage.clear())

  it('records creation and meaningful field changes without duplicate save events', async () => {
    let instant = new Date('2026-09-25T10:00:00.000Z')
    const repository = createLocalTicketRepository(window.localStorage, () => instant) as unknown as RepositoryWithActivity
    expect(repository.history).toBeTypeOf('function')
    if (!repository.history) return

    const ticket = await repository.create({
      customer: 'Example Salon',
      title: 'Printer offline',
      description: 'The printer is offline.',
      category: 'Printer / Hardware',
      priority: 'medium',
      status: 'new',
      investigation: '',
      rootCause: '',
      solution: '',
      internalNotes: '',
    })
    const createdHistory = await repository.history(ticket.ticketNumber as string)
    expect(createdHistory.map((entry) => entry.action)).toEqual(['created'])

    instant = new Date('2026-09-25T10:10:00.000Z')
    const changed = await repository.update({ ...ticket, title: 'Printer cable is loose', priority: 'high', status: 'resolved' })
    expect((await repository.history(ticket.ticketNumber as string)).map((entry) => entry.action).sort()).toEqual(['created', 'priority_changed', 'resolved', 'updated'])

    instant = new Date('2026-09-25T10:15:00.000Z')
    await repository.update(changed)
    expect((await repository.history(ticket.ticketNumber as string)).length).toBe(4)
  })

  it('merges imported records idempotently without overwriting an existing ticket', async () => {
    const repository = createLocalTicketRepository(window.localStorage) as unknown as RepositoryWithActivity
    expect(repository.importTickets).toBeTypeOf('function')
    if (!repository.importTickets) return

    const existing = (await repository.list()).tickets[0]
    expect(existing).toBeDefined()
    if (!existing) return
    const importedCopy = { ...existing, title: 'Do not overwrite this ticket' }
    const newTicket = { ...existing, id: 'IT-024', ticketNumber: 'IT-024', title: 'Imported ticket' }

    const result = await repository.importTickets([importedCopy, newTicket])
    expect(result).toEqual({ imported: 1, skipped: 1, renumbered: 0 })
    expect((await repository.list()).tickets.find((ticket) => ticket.ticketNumber === existing.ticketNumber)?.title).toBe(existing.title)
    expect((await repository.list()).tickets.some((ticket) => ticket.ticketNumber === 'IT-024')).toBe(true)
  })

  it('records reopening a closed ticket as a reopen action', async () => {
    let instant = new Date('2026-09-25T10:00:00.000Z')
    const repository = createLocalTicketRepository(window.localStorage, () => instant) as unknown as RepositoryWithActivity
    expect(repository.history).toBeTypeOf('function')
    if (!repository.history) return
    const ticket = await repository.create({
      customer: 'Example Salon', title: 'Closed network issue', description: '', category: 'Network',
      priority: 'low', status: 'closed', investigation: '', rootCause: '', solution: '', internalNotes: '',
    })

    instant = new Date('2026-09-25T10:01:00.000Z')
    await repository.update({ ...ticket, status: 'investigating' })

    expect((await repository.history(ticket.ticketNumber as string)).map((entry) => entry.action)).toEqual(['reopened', 'created'])
  })

  it('summarizes tickets and surfaces active critical, waiting, or stale work', async () => {
    const repository = createLocalTicketRepository(window.localStorage, () => new Date('2026-09-26T10:00:00.000Z')) as unknown as RepositoryWithActivity
    expect(repository.getDashboard).toBeTypeOf('function')
    if (!repository.getDashboard) return

    const dashboard = await repository.getDashboard()
    expect(dashboard.summary.total).toBe(5)
    expect(dashboard.recentTickets.map((ticket) => ticket.ticketNumber).slice(0, 3)).toEqual(['IT-004', 'IT-002', 'IT-003'])
    expect(dashboard.attentionTickets.map((ticket) => ticket.ticketNumber).sort()).toEqual(['IT-002', 'IT-003', 'IT-004'])
  })
})
