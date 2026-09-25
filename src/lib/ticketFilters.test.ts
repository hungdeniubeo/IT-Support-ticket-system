import { describe, expect, it } from 'vitest'
import * as filters from './ticketFilters'

const buildSearchFilter = (filters as typeof filters & {
  buildTicketSearchFilter?: (search: string) => string
}).buildTicketSearchFilter

describe('PostgREST ticket search filter', () => {
  it('escapes LIKE wildcards and quotes while searching only ticket number, title, and customer', () => {
    expect(buildSearchFilter).toBeTypeOf('function')
    if (!buildSearchFilter) return

    expect(buildSearchFilter('a,b(c)%_"x')).toBe([
      'ticket_number.ilike."%a,b(c)\\%\\_\\"x%"',
      'title.ilike."%a,b(c)\\%\\_\\"x%"',
      'customer.ilike."%a,b(c)\\%\\_\\"x%"',
    ].join(','))
  })
})
