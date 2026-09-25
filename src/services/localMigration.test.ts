import { beforeEach, describe, expect, it } from 'vitest'
import * as repositoryModule from './ticketRepository'
import { LOCAL_TICKET_STORAGE_KEY } from './ticketRepository'

const migration = repositoryModule as typeof repositoryModule & {
  inspectLocalMigration?: (storage: Storage, userId: string) => { tickets: unknown[]; count: number } | null
  completeLocalMigration?: (storage: Storage, userId: string, result: 'imported' | 'skipped') => void
}

describe('local ticket migration preview', () => {
  let storage: Storage

  beforeEach(() => {
    localStorage.clear()
    storage = window.localStorage
  })

  it('finds legacy tickets without rewriting the backup and tracks completion per account', () => {
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
    storage.setItem(LOCAL_TICKET_STORAGE_KEY, storedValue)

    expect(migration.inspectLocalMigration).toBeTypeOf('function')
    expect(migration.completeLocalMigration).toBeTypeOf('function')
    if (!migration.inspectLocalMigration || !migration.completeLocalMigration) return

    expect(migration.inspectLocalMigration(storage, 'user-one')).toMatchObject({ count: 1 })
    migration.completeLocalMigration(storage, 'user-one', 'skipped')
    expect(migration.inspectLocalMigration(storage, 'user-one')).toBeNull()
    expect(migration.inspectLocalMigration(storage, 'user-two')).toMatchObject({ count: 1 })
    expect(storage.getItem(LOCAL_TICKET_STORAGE_KEY)).toBe(storedValue)
  })

  it('does not seed sample tickets when there is no local migration source', () => {
    expect(migration.inspectLocalMigration).toBeTypeOf('function')
    if (!migration.inspectLocalMigration) return

    expect(migration.inspectLocalMigration(storage, 'user-one')).toBeNull()
    expect(storage.getItem(LOCAL_TICKET_STORAGE_KEY)).toBeNull()
  })
})
