import { describe, expect, it } from 'vitest'
import { DEMO_NOW, monthLabel, monthName, monthOf, shiftMonth } from './period.ts'

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

describe('shiftMonth', () => {
  it('moves across year boundaries both ways', () => {
    expect(shiftMonth('2026-10', -5)).toBe('2026-05')
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  })
})

describe('monthLabel', () => {
  it('names the month and year', () => {
    expect(monthLabel('2026-10')).toBe('October 2026')
  })
})

describe('DEMO_NOW', () => {
  it('is 20 November 2026 in South Africa', () => {
    expect(monthOf(DEMO_NOW)).toBe('2026-11')
    expect(DEMO_NOW).toBe('2026-11-20T08:00:00.000Z')
  })
})
