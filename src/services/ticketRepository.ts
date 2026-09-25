import type { NewTicket, Ticket, TicketDashboardSnapshot, TicketHistoryAction, TicketHistoryEntry, TicketQuery, TicketRepository } from '../domain/ticket'
import { normalizeTicket } from '../domain/normalizeTicket'
import { validateNewTicket } from '../domain/ticketValidation'
import { filterTickets } from '../lib/ticketFilters'
import { prioritizeAttentionTickets, summarizeTickets } from '../lib/ticketStats'
import { seedTickets } from './seedTickets'
import { getBrowserStorage } from './browserStorage'

export const LOCAL_TICKET_STORAGE_KEY = 'it-support-ticket-system:v1'
const HISTORY_STORAGE_KEY = 'it-support-ticket-system:history:v1'

const HISTORY_FIELDS = ['customer', 'title', 'description', 'category', 'investigation', 'rootCause', 'solution', 'internalNotes'] as const

interface StoredState {
  tickets: Ticket[]
  nextTicketNumber: number
}

function isStoredState(value: unknown): value is StoredState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<StoredState>
  return Array.isArray(candidate.tickets) && Number.isSafeInteger(candidate.nextTicketNumber)
}

function ticketSequence(ticketNumber: string): number {
  const match = /^IT-(\d+)$/.exec(ticketNumber)
  return match ? Number(match[1]) : 0
}

export function createLocalTicketRepository(
  storage: Storage,
  now: () => Date = () => new Date(),
): TicketRepository {
  function persist(state: StoredState): void {
    storage.setItem(LOCAL_TICKET_STORAGE_KEY, JSON.stringify(state))
  }

  function readState(): StoredState {
    const stored = storage.getItem(LOCAL_TICKET_STORAGE_KEY)
    if (stored === null) {
      const initialState = {
        tickets: seedTickets.map((ticket) => ({ ...ticket })),
        nextTicketNumber: seedTickets.length + 1,
      }
      persist(initialState)
      return initialState
    }

    try {
      const parsed: unknown = JSON.parse(stored)
      if (isStoredState(parsed)) {
        const tickets = parsed.tickets.map(normalizeTicket).filter((ticket): ticket is Ticket => ticket !== null)
        const nextFromTickets = tickets.reduce(
          (next, ticket) => Math.max(next, ticketSequence(ticket.ticketNumber) + 1),
          1,
        )
        return {
          tickets,
          nextTicketNumber: Math.max(parsed.nextTicketNumber, nextFromTickets),
        }
      }
    } catch {
      // Keep the first-run experience usable if saved browser data is malformed.
    }

    const recoveryState = { tickets: [], nextTicketNumber: 1 }
    return recoveryState
  }

  return {
    async list(query: TicketQuery = {}) {
      const page = Math.max(1, Math.floor(query.page ?? 1))
      const pageSize = Math.min(100, Math.max(1, Math.floor(query.pageSize ?? 50)))
      const filtered = filterTickets(readState().tickets, query)
      const start = (page - 1) * pageSize
      return { tickets: filtered.slice(start, start + pageSize), total: filtered.length, page, pageSize }
    },

    async listAll() {
      return filterTickets(readState().tickets)
    },

    async getDashboard(): Promise<TicketDashboardSnapshot> {
      const tickets = filterTickets(readState().tickets)
      const openTickets = tickets.filter((ticket) => ['new', 'investigating', 'waiting'].includes(ticket.status))
      const staleBefore = now().getTime() - 24 * 60 * 60 * 1000
        const attentionTickets = prioritizeAttentionTickets(filterTickets(openTickets.filter((ticket) =>
          ticket.priority === 'critical'
          || ticket.status === 'waiting'
          || Date.parse(ticket.updatedAt) < staleBefore,
        ))).slice(0, 6)
      return {
        summary: summarizeTickets(tickets),
        recentTickets: tickets.slice(0, 6),
        attentionTickets,
      }
    },

    async get(ticketNumber) {
      return readState().tickets.find((ticket) => ticket.ticketNumber === ticketNumber)
    },

    async create(input: NewTicket) {
      if (Object.keys(validateNewTicket(input)).length) {
        throw new Error('Vui lòng kiểm tra các trường bắt buộc.')
      }
      const state = readState()
      const ticketNumber = `IT-${String(state.nextTicketNumber).padStart(3, '0')}`
      const timestamp = now().toISOString()
      const ticket: Ticket = {
        ...input,
        id: ticketNumber,
        ticketNumber,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      state.tickets.push(ticket)
      state.nextTicketNumber += 1
      persist(state)
      appendHistory(storage, {
        id: createHistoryId(now), ticketId: ticket.id, userId: null, action: 'created',
        fieldName: null, oldValue: null, newValue: null, createdAt: timestamp,
      })
      return ticket
    },

    async update(ticket) {
      const state = readState()
      const index = state.tickets.findIndex((saved) => saved.ticketNumber === ticket.ticketNumber)
      if (index === -1) throw new Error(`Ticket ${ticket.ticketNumber} was not found.`)

      const existing = state.tickets[index]
      if (!existing) throw new Error(`Ticket ${ticket.ticketNumber} was not found.`)
      const updated: Ticket = {
        ...ticket,
        id: existing.id,
        ticketNumber: existing.ticketNumber,
        createdAt: existing.createdAt,
        updatedAt: now().toISOString(),
      }
      state.tickets[index] = updated
      persist(state)
      recordTicketChanges(storage, existing, updated, now)
      return updated
    },

    async delete(ticketNumber) {
      const state = readState()
      const removed = state.tickets.find((ticket) => ticket.ticketNumber === ticketNumber)
      state.tickets = state.tickets.filter((ticket) => ticket.ticketNumber !== ticketNumber)
      persist(state)
      if (removed) {
        storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(readHistory(storage).filter((entry) => entry.ticketId !== removed.id)))
      }
    },

    async history(ticketNumber) {
      const ticket = readState().tickets.find((saved) => saved.ticketNumber === ticketNumber)
      if (!ticket) return []
      return readHistory(storage)
        .filter((entry) => entry.ticketId === ticket.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },

    async importTickets(rawTickets) {
      const state = readState()
      const ticketNumbers = new Set(state.tickets.map((ticket) => ticket.ticketNumber))
      const history = readHistory(storage)
      let imported = 0
      let skipped = 0
      for (const rawTicket of rawTickets) {
        const ticket = normalizeTicket(rawTicket)
        if (!ticket || ticketNumbers.has(ticket.ticketNumber)) {
          skipped += 1
          continue
        }
        state.tickets.push(ticket)
        ticketNumbers.add(ticket.ticketNumber)
        state.nextTicketNumber = Math.max(state.nextTicketNumber, ticketSequence(ticket.ticketNumber) + 1)
        history.push({
          id: createHistoryId(now), ticketId: ticket.id, userId: null, action: 'created',
          fieldName: null, oldValue: null, newValue: null, createdAt: ticket.createdAt,
        })
        imported += 1
      }
      persist(state)
      storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
      return { imported, skipped, renumbered: 0 }
    },
  }
}

export const ticketRepository = createLocalTicketRepository(getBrowserStorage())

export { completeLocalMigration, inspectLocalMigration } from './localMigration'
export { mapTicketRow } from './supabaseTicketRepository'

function readHistory(storage: Storage): TicketHistoryEntry[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(HISTORY_STORAGE_KEY) ?? '[]')
    return Array.isArray(value) ? value as TicketHistoryEntry[] : []
  } catch {
    return []
  }
}

function createHistoryId(now: () => Date): string {
  return `local-${now().getTime()}-${Math.random().toString(36).slice(2, 8)}`
}

function appendHistory(storage: Storage, entry: TicketHistoryEntry): void {
  storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([...readHistory(storage), entry]))
}

function recordTicketChanges(storage: Storage, before: Ticket, after: Ticket, now: () => Date): void {
  const entries: TicketHistoryEntry[] = []
  const createdAt = now().toISOString()
  if (before.status !== after.status) {
    let action: TicketHistoryAction = 'status_changed'
    if (after.status === 'resolved') action = 'resolved'
    else if ((before.status === 'resolved' || before.status === 'closed') && ['new', 'investigating', 'waiting'].includes(after.status)) action = 'reopened'
    entries.push({ id: createHistoryId(now), ticketId: after.id, userId: null, action, fieldName: 'status', oldValue: before.status, newValue: after.status, createdAt })
  }
  if (before.priority !== after.priority) {
    entries.push({ id: createHistoryId(now), ticketId: after.id, userId: null, action: 'priority_changed', fieldName: 'priority', oldValue: before.priority, newValue: after.priority, createdAt })
  }
  for (const fieldName of HISTORY_FIELDS) {
    if (before[fieldName] !== after[fieldName]) {
      entries.push({ id: createHistoryId(now), ticketId: after.id, userId: null, action: 'updated', fieldName, oldValue: String(before[fieldName] ?? ''), newValue: String(after[fieldName] ?? ''), createdAt })
    }
  }
  if (entries.length) storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([...readHistory(storage), ...entries]))
}
