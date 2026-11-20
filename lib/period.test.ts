import { describe, expect, it } from 'vitest'
import { monthName, monthOf } from './period.ts'

describe('monthOf (Africa/Johannesburg)', () => {
  it('puts 23:30 SAST on 31 Oct in October although it is 21:30 UTC', () => {
    expect(monthOf('2026-10-31T21:30:00Z')).toBe('2026-10')
  })

  it('puts 00:30 SAST on 1 Nov in November although it is still 31 Oct UTC', () => {
    expect(monthOf('2026-10-31T22:30:00Z')).toBe('2026-11')
  })

  it('crosses the year boundary in SAST', () => {
    expect(monthOf('2026-12-31T22:00:00Z')).toBe('2027-01')
  })

  it('rejects an invalid timestamp', () => {
    expect(() => monthOf('not a date')).toThrow(RangeError)
  })
})

describe('monthName', () => {
  it('names the month', () => {
    expect(monthName('2026-10')).toBe('October')
    expect(monthName('2026-09')).toBe('September')
  })
})
