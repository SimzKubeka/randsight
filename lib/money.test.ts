import { describe, expect, it } from 'vitest'
import { formatRand } from './money.ts'

describe('formatRand', () => {
  it.each([
    [270000, 'R2,700'],
    [270050, 'R2,700.50'],
    [5, 'R0.05'],
    [0, 'R0'],
    [-15000, '−R150'],
    [123456789, 'R1,234,567.89'],
  ])('%i cents → %s', (cents, expected) => {
    expect(formatRand(cents)).toBe(expected)
  })

  it('rejects non-integer cents', () => {
    expect(() => formatRand(10.5)).toThrow(RangeError)
  })
})
