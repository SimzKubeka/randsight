import { describe, expect, it } from 'vitest'
import { niceTicks } from './chart.ts'

const R = (rands: number) => rands * 100

describe('niceTicks', () => {
  it('brackets six months of spending in tidy R1,000 steps with room above and below', () => {
    const ticks = niceTicks(R(15860), R(18700))
    expect(ticks).toEqual([R(15000), R(16000), R(17000), R(18000), R(19000)])
  })

  it('adds a step when a value sits exactly on the edge', () => {
    expect(niceTicks(R(16000), R(18000))).toEqual([15500, 16000, 16500, 17000, 17500, 18000, 18500].map(R))
  })

  it('never goes below zero and copes with a single value', () => {
    const ticks = niceTicks(0, 0)
    expect(ticks[0]).toBe(0)
    expect(ticks.length).toBeGreaterThan(1)
  })
})
