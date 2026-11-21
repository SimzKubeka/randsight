import { describe, expect, it } from 'vitest'
import { dayOfMonth, daysInMonth, progress, SAMPLE_PAYMENT } from './live-track.ts'
import { DEMO_NOW } from './period.ts'

const TARGET = 600000 // R6,000

describe('progress', () => {
  it('before the sample payment: R3,800 spent, R2,200 left, R200 below an even pace of R4,000', () => {
    expect(progress(TARGET, 380000, DEMO_NOW)).toEqual({
      targetCents: TARGET,
      spentCents: 380000,
      remainingCents: 220000,
      overTarget: false,
      paceCents: 400000,
      paceDeltaCents: -20000,
      day: 20,
      days: 30,
    })
  })

  it('after the R450 sample payment: R4,250 spent, R1,750 left, R250 above pace', () => {
    const after = progress(TARGET, 380000 + SAMPLE_PAYMENT.amountCents, DEMO_NOW)
    expect(after).toMatchObject({ spentCents: 425000, remainingCents: 175000, paceDeltaCents: 25000, overTarget: false })
  })

  it('past the target the remainder goes negative and is flagged', () => {
    expect(progress(TARGET, 650000, DEMO_NOW)).toMatchObject({ remainingCents: -50000, overTarget: true })
    expect(progress(TARGET, TARGET, DEMO_NOW).overTarget).toBe(false)
  })

  it('rounds the pace allowance to whole cents', () => {
    // Day 1 of 31: R6,000 / 31 = R193.548… → 19,355 cents.
    expect(progress(TARGET, 0, '2026-12-01T08:00:00Z').paceCents).toBe(19355)
  })
})

describe('the demo calendar runs on South African time', () => {
  it('00:30 SAST on 20 November is day 20, though it is still the 19th in UTC', () => {
    expect(dayOfMonth('2026-11-19T22:30:00Z')).toBe(20)
  })

  it('knows month lengths, including leap years', () => {
    expect([daysInMonth('2026-11'), daysInMonth('2026-12'), daysInMonth('2027-02'), daysInMonth('2028-02')]).toEqual([30, 31, 28, 29])
  })
})
