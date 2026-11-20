const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const withCents = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Integer cents → "R2,700", "R2,700.50" or "−R150". */
export function formatRand(cents: number): string {
  if (!Number.isInteger(cents)) throw new RangeError(`Money must be integer cents, got ${cents}`)
  const abs = Math.abs(cents)
  const amount = (abs % 100 === 0 ? whole : withCents).format(abs / 100)
  return `${cents < 0 ? '−' : ''}R${amount}`
}
