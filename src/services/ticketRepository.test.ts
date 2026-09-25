import { beforeEach, describe, expect, it } from 'vitest'
import { createLocalTicketRepository } from './ticketRepository'

describe('local ticket repository', () => {
  let storage: Storage
  let instant: string

  beforeEach(() => {
    localStorage.clear()
    storage = window.localStorage
    instant = '2026-09-25T10:00:00.000Z'
  })

  it('seeds realistic cases once on first launch', async () => {
    const repository = createLocalTicketRepository(storage, () => new Date(instant))

    const firstLoad = await repository.list()
    const secondLoad = await repository.list()

    expect(firstLoad.length).toBeGreaterThanOrEqual(4)
    expect(await repository.get('IT-001')).toMatchObject({
      ticketNumber: 'IT-001',
      customer: 'Veganic Nail Spa',
      title: 'Clover không thể kết nối với Nail360',
      category: 'Clover / Payment',
      priority: 'High',
      status: 'Resolved',
      rootCause: 'Clover Environment đang được đặt ở chế độ Sandbox.',
    })
    expect(secondLoad).toEqual(firstLoad)
  })

  it('does not repopulate tickets after the user removes all cases', async () => {
    const repository = createLocalTicketRepository(storage, () => new Date(instant))
    const tickets = await repository.list()
    for (const ticket of tickets) await repository.delete(ticket.id)

    expect(await repository.list()).toEqual([])
  })

  it('loads existing v1 browser data without replacing it with sample tickets', async () => {
    const legacyTicket = {
      id: 'IT-024',
      ticketNumber: 'IT-024',
      customer: 'Existing Salon',
      title: 'Saved issue',
      description: 'Existing description',
      category: 'Network',
      priority: 'Medium',
      status: 'Waiting',
      investigation: '',
      rootCause: '',
      solution: '',
      internalNotes: '',
      createdAt: '2026-09-20T10:00:00.000Z',
      updatedAt: '2026-09-20T10:00:00.000Z',
    }
    const storedValue = JSON.stringify({ tickets: [legacyTicket], nextTicketNumber: 25 })
    storage.setItem('it-support-ticket-system:v1', storedValue)

    const repository = createLocalTicketRepository(storage, () => new Date(instant))

    expect(await repository.list()).toEqual([legacyTicket])
    expect(storage.getItem('it-support-ticket-system:v1')).toBe(storedValue)
  })

  it('keeps saved tickets available through a fresh repository instance', async () => {
    const firstRepository = createLocalTicketRepository(storage, () => new Date(instant))
    const created = await firstRepository.create({
      customer: 'Northside Nail Studio',
      title: 'Receipt printer is offline',
      description: 'The front desk printer is not responding.',
      category: 'Printer / Hardware',
      priority: 'Medium',
      status: 'New',
      investigation: '',
      rootCause: '',
      solution: '',
      internalNotes: '',
    })

    const reloadedRepository = createLocalTicketRepository(storage, () => new Date(instant))
    expect(await reloadedRepository.get(created.ticketNumber)).toEqual(created)
  })

  it('never reuses a ticket number after deleting the latest case', async () => {
    const repository = createLocalTicketRepository(storage, () => new Date(instant))
    const tickets = await repository.list()
    const latest = tickets.at(-1)
    expect(latest).toBeDefined()
    if (!latest) throw new Error('Seeded tickets should exist')

    await repository.delete(latest.id)
    const created = await repository.create({
      customer: 'Northside Nail Studio',
      title: 'Receipt printer is offline',
      description: 'The front desk printer is not responding.',
      category: 'Printer / Hardware',
      priority: 'Medium',
      status: 'New',
      investigation: '',
      rootCause: '',
      solution: '',
      internalNotes: '',
    })

    expect(created.ticketNumber).toBe(`IT-${String(tickets.length + 1).padStart(3, '0')}`)
  })

  it('preserves identity and creation time while updating a case', async () => {
    const repository = createLocalTicketRepository(storage, () => new Date(instant))
    const [ticket] = await repository.list()
    if (!ticket) throw new Error('Seeded tickets should exist')
    instant = '2026-09-26T10:00:00.000Z'

    const updated = await repository.update({ ...ticket, title: 'Updated issue title' })

    expect(updated).toMatchObject({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      createdAt: ticket.createdAt,
      title: 'Updated issue title',
      updatedAt: instant,
    })
  })
})
