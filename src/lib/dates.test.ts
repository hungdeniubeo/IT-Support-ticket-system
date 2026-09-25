import { describe, expect, it } from 'vitest'
import { formatDate } from './dates'

describe('Vietnamese date formatting', () => {
  it('formats local dates and times in day/month/year order', () => {
    const localDate = new Date(2026, 8, 25, 14, 35)
    expect(formatDate(localDate.toISOString())).toBe('25/09/2026, 14:35')
    expect(formatDate(localDate.toISOString(), false)).toBe('25/09/2026')
  })

  it('returns a placeholder for an invalid timestamp', () => {
    expect(formatDate('not-a-date')).toBe('—')
  })
})
