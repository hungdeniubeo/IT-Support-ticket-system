import type { Ticket } from '../domain/ticket'
import { normalizeTicket } from '../domain/normalizeTicket'
import { LOCAL_TICKET_STORAGE_KEY } from './ticketRepository'

const MIGRATION_KEY_PREFIX = 'it-support-ticket-system:supabase-migration:v1'

export interface LocalMigrationPreview {
  tickets: Ticket[]
  count: number
}

export function inspectLocalMigration(storage: Storage, userId: string): LocalMigrationPreview | null {
  if (!userId || storage.getItem(`${MIGRATION_KEY_PREFIX}:${encodeURIComponent(userId)}`)) return null
  const source = storage.getItem(LOCAL_TICKET_STORAGE_KEY)
  if (!source) return null

  try {
    const value: unknown = JSON.parse(source)
    if (!value || typeof value !== 'object' || !Array.isArray((value as { tickets?: unknown }).tickets)) return null
    const tickets = ((value as { tickets: unknown[] }).tickets)
      .map(normalizeTicket)
      .filter((ticket): ticket is Ticket => ticket !== null)
    return tickets.length ? { tickets, count: tickets.length } : null
  } catch {
    return null
  }
}

export function completeLocalMigration(storage: Storage, userId: string, result: 'imported' | 'skipped'): void {
  if (!userId) return
  storage.setItem(`${MIGRATION_KEY_PREFIX}:${encodeURIComponent(userId)}`, JSON.stringify({ result, completedAt: new Date().toISOString() }))
}
