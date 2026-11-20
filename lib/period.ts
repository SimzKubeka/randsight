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
