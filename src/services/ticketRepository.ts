import type { NewTicket, Ticket, TicketRepository } from '../domain/ticket'
import { seedTickets } from './seedTickets'

const STORAGE_KEY = 'it-support-ticket-system:v1'

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
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  function readState(): StoredState {
    const stored = storage.getItem(STORAGE_KEY)
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
        const nextFromTickets = parsed.tickets.reduce(
          (next, ticket) => Math.max(next, ticketSequence(ticket.ticketNumber) + 1),
          1,
        )
        return {
          tickets: parsed.tickets,
          nextTicketNumber: Math.max(parsed.nextTicketNumber, nextFromTickets),
        }
      }
    } catch {
      // Keep the first-run experience usable if saved browser data is malformed.
    }

    const recoveryState = { tickets: [], nextTicketNumber: 1 }
    persist(recoveryState)
    return recoveryState
  }

  return {
    async list() {
      return readState().tickets.sort((a, b) => {
        const dateOrder = b.createdAt.localeCompare(a.createdAt)
        return dateOrder || ticketSequence(b.ticketNumber) - ticketSequence(a.ticketNumber)
      })
    },

    async get(ticketNumber) {
      return readState().tickets.find((ticket) => ticket.ticketNumber === ticketNumber)
    },

    async create(input: NewTicket) {
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
      return updated
    },

    async delete(ticketNumber) {
      const state = readState()
      state.tickets = state.tickets.filter((ticket) => ticket.ticketNumber !== ticketNumber)
      persist(state)
    },
  }
}

export const ticketRepository = createLocalTicketRepository(window.localStorage)
