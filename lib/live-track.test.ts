import { describe, expect, it } from 'vitest'
import { cumulative, dayOfMonth, daysInMonth, progress, SAMPLE_PAYMENT } from './live-track.ts'
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
      daysLeft: 10,
      dailyAllowanceCents: 22000,
      forecastCents: 570000,
    })
  })

  it('after the R450 sample payment: R4,250 spent, R1,750 left, R250 above pace, heading for R6,375', () => {
    const after = progress(TARGET, 380000 + SAMPLE_PAYMENT.amountCents, DEMO_NOW)
    expect(after).toMatchObject({
      spentCents: 425000,
      remainingCents: 175000,
      paceDeltaCents: 25000,
      overTarget: false,
      dailyAllowanceCents: 17500,
      forecastCents: 637500,
    })
  })

  it('offers no daily allowance once the target is used up or the month is over', () => {
    expect(progress(TARGET, 650000, DEMO_NOW).dailyAllowanceCents).toBe(0)
    expect(progress(TARGET, 100000, '2026-11-30T12:00:00Z')).toMatchObject({ daysLeft: 0, dailyAllowanceCents: 0, forecastCents: 100000 })
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

describe('cumulative', () => {
  it('adds up spending day by day in South African time, with refunds coming off', () => {
    const payments = [
      { postedAt: '2026-11-19T16:00:00Z', kind: 'spend' as const, amountCents: 45000 },
      { postedAt: '2026-11-06T09:00:00Z', kind: 'spend' as const, amountCents: 105000 },
      { postedAt: '2026-11-06T22:30:00Z', kind: 'spend' as const, amountCents: 10000 }, // 00:30 on the 7th in SAST
      { postedAt: '2026-11-13T09:00:00Z', kind: 'refund' as const, amountCents: 5000 },
    ]
    expect(cumulative(payments)).toEqual([
      { day: 6, cents: 105000 },
      { day: 7, cents: 115000 },
      { day: 13, cents: 110000 },
      { day: 19, cents: 155000 },
    ])
  })
})
