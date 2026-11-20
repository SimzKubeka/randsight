export const TIME_ZONE = 'Africa/Johannesburg'

const monthKey = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit' })
const longMonth = new Intl.DateTimeFormat('en-ZA', { timeZone: 'UTC', month: 'long' })

/** Reporting month ('YYYY-MM') of a UTC timestamp, in South African time. */
export function monthOf(isoUtc: string): string {
  const date = new Date(isoUtc)
  if (Number.isNaN(date.getTime())) throw new RangeError(`Invalid timestamp: ${isoUtc}`)
  return monthKey.format(date)
}

/** '2026-10' → 'October' */
export function monthName(month: string): string {
  return longMonth.format(new Date(`${month}-01T00:00:00Z`))
}

const monthYear = new Intl.DateTimeFormat('en-ZA', { timeZone: 'UTC', month: 'long', year: 'numeric' })

/** The fixed demo clock: 10:00 SAST on 20 November 2026. */
export const DEMO_NOW = new Date('2026-11-20T10:00:00+02:00').toISOString()

/** '2026-10' → 'October 2026' */
export function monthLabel(month: string): string {
  return monthYear.format(new Date(`${month}-01T00:00:00Z`))
}

/** '2026-01', -1 → '2025-12' */
export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number)
  return new Date(Date.UTC(year!, m! - 1 + delta, 1)).toISOString().slice(0, 7)
}
