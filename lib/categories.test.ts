import { describe, expect, it } from 'vitest'
import { isCategory, rowLabel } from './categories.ts'

describe('categories', () => {
  it('accepts known categories only', () => {
    expect(isCategory('medical')).toBe(true)
    expect(isCategory('income')).toBe(true)
    expect(isCategory('transfer')).toBe(false)
    expect(isCategory('toString')).toBe(false)
    expect(isCategory(['medical'])).toBe(false)
  })

  it('labels rows as the design reads them', () => {
    expect(rowLabel('income')).toBe('Salary received')
    expect(rowLabel('medical')).toBe('Medical spending')
    expect(rowLabel('groceries')).toBe('Grocery spending')
  })
})
