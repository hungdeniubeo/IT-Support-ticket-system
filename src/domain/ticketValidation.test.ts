import { beforeEach, describe, expect, it } from 'vitest'
import { createLocalTicketRepository } from '../services/ticketRepository'
import * as ticketValidation from './ticketValidation'

describe('ticket validation', () => {
  beforeEach(() => localStorage.clear())

  it('rejects whitespace-only required fields without saving a ticket', async () => {
    const repository = createLocalTicketRepository(window.localStorage)
    await expect(repository.create({
      customer: '   ',
      title: '  ',
      description: '  ',
      category: 'Network',
      priority: 'medium',
      status: 'new',
      investigation: '',
      rootCause: '',
      solution: '',
      internalNotes: '',
    })).rejects.toThrow('Vui lòng kiểm tra các trường bắt buộc.')

    expect((await repository.list()).total).toBe(5)
  })

  it('accepts a ticket without a description', async () => {
    const repository = createLocalTicketRepository(window.localStorage)
    const created = await repository.create({
      customer: 'Northside Nail Studio',
      title: 'Wi-Fi reconnect request',
      description: '',
      category: 'Network',
      priority: 'medium',
      status: 'new',
      investigation: '',
      rootCause: '',
      solution: '',
      internalNotes: '',
    })

    expect(created.description).toBe('')
  })

  it('accepts supported files and rejects disallowed types or files over 10 MiB', () => {
    const validateAttachment = (ticketValidation as typeof ticketValidation & {
      validateAttachment?: (file: { name: string; type: string; size: number }) => string | null
    }).validateAttachment
    expect(validateAttachment).toBeTypeOf('function')
    if (!validateAttachment) return

    expect(validateAttachment({ name: 'screen.webp', type: 'image/webp', size: 1024 })).toBeNull()
    expect(validateAttachment({ name: 'debug.log', type: 'text/plain', size: 0 })).not.toBeNull()
    expect(validateAttachment({ name: 'notes.exe', type: 'text/plain', size: 1024 })).not.toBeNull()
    expect(validateAttachment({ name: 'large.pdf', type: 'application/pdf', size: 10 * 1024 * 1024 + 1 })).not.toBeNull()
  })
})
