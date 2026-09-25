import { describe, expect, it } from 'vitest'
import * as ticketRepositoryModule from './ticketRepository'

const mapTicketRow = (ticketRepositoryModule as typeof ticketRepositoryModule & {
  mapTicketRow?: (row: Record<string, unknown>) => unknown
}).mapTicketRow

describe('Supabase ticket row mapping', () => {
  it('maps database snake_case fields to the application ticket model', () => {
    expect(mapTicketRow).toBeTypeOf('function')
    if (!mapTicketRow) return

    expect(mapTicketRow({
      id: '7b0b7a8b-f47b-4cdd-9f15-cc5f775e2e22',
      ticket_number: 'IT-023',
      user_id: 'd2e643a1-1262-4736-9907-3b13c8df9949',
      customer: 'Veganic Nail Spa',
      title: 'Clover không kết nối Nail360',
      description: 'Mô tả',
      category: 'Clover / Payment',
      priority: 'high',
      status: 'investigating',
      investigation: 'Đã kiểm tra kết nối.',
      root_cause: '',
      solution: '',
      internal_notes: 'Ghi chú',
      created_at: '2026-09-25T10:00:00.000Z',
      updated_at: '2026-09-25T10:10:00.000Z',
    })).toEqual({
      id: '7b0b7a8b-f47b-4cdd-9f15-cc5f775e2e22',
      ticketNumber: 'IT-023',
      customer: 'Veganic Nail Spa',
      title: 'Clover không kết nối Nail360',
      description: 'Mô tả',
      category: 'Clover / Payment',
      priority: 'high',
      status: 'investigating',
      investigation: 'Đã kiểm tra kết nối.',
      rootCause: '',
      solution: '',
      internalNotes: 'Ghi chú',
      createdAt: '2026-09-25T10:00:00.000Z',
      updatedAt: '2026-09-25T10:10:00.000Z',
    })
  })
})
