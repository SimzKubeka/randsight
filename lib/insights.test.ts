import { describe, expect, it } from 'vitest'
import { describeChange, explainChange, monthTotals, type TotalRow } from './insights'

const R = (rands: number) => rands * 100

// Acceptance fixture from the brief.
const rows: TotalRow[] = [
  { month: '2026-09', category: 'income', kind: 'income', cents: R(30000) },
  { month: '2026-09', category: 'medical', kind: 'spend', cents: R(400) },
  { month: '2026-09', category: 'groceries', kind: 'spend', cents: R(4200) },
  { month: '2026-09', category: 'household', kind: 'spend', cents: R(12000) },
  { month: '2026-10', category: 'income', kind: 'income', cents: R(29400) },
  { month: '2026-10', category: 'medical', kind: 'spend', cents: R(1600) },
  { month: '2026-10', category: 'groceries', kind: 'spend', cents: R(5100) },
  { month: '2026-10', category: 'household', kind: 'spend', cents: R(12000) },
]
const sep = monthTotals('2026-09', rows)
const oct = monthTotals('2026-10', rows)

describe('monthTotals', () => {
  it('matches the acceptance fixture', () => {
    expect(sep).toMatchObject({ inCents: R(30000), outCents: R(16600), leftOverCents: R(13400), empty: false })
    expect(oct).toMatchObject({ inCents: R(29400), outCents: R(18700), leftOverCents: R(10700), empty: false })
    expect(oct.byCategory).toEqual({ medical: R(1600), groceries: R(5100), household: R(12000) })
  })

  it('nets a refund against its category in the month it posts', () => {
    const t = monthTotals('2026-08', [
      { month: '2026-08', category: 'baby', kind: 'spend', cents: R(900) },
      { month: '2026-08', category: 'baby', kind: 'refund', cents: R(250) },
    ])
    expect(t.byCategory.baby).toBe(R(650))
    expect(t.outCents).toBe(R(650))
  })

  it('keeps a category net negative when refunds exceed spending', () => {
    const t = monthTotals('2026-08', [{ month: '2026-08', category: 'baby', kind: 'refund', cents: R(100) }])
    expect(t.byCategory.baby).toBe(-R(100))
    expect(t.leftOverCents).toBe(R(100))
  })

  it('excludes transfers from money in, money out and categories', () => {
    const t = monthTotals('2026-10', [
      ...rows,
      { month: '2026-10', category: 'transfer', kind: 'transfer', cents: R(5000) },
    ])
    expect(t).toEqual(oct)
  })

  it('reports an empty month', () => {
    expect(monthTotals('2026-04', rows)).toEqual({
      month: '2026-04',
      inCents: 0,
      outCents: 0,
      leftOverCents: 0,
      byCategory: {},
      empty: true,
    })
  })
})

describe('explainChange', () => {
  const e = explainChange(sep, oct)!

  it('reconciles R600 less income + R1,200 medical + R900 groceries = R2,700 less left over', () => {
    expect(e.inChangeCents).toBe(-R(600))
    expect(e.outChangeCents).toBe(R(2100))
    expect(e.leftOverChangeCents).toBe(-R(2700))
    expect(e.drivers.map((d) => [d.key, d.changeCents, d.effectCents])).toEqual([
      ['medical', R(1200), -R(1200)],
      ['groceries', R(900), -R(900)],
      ['income', -R(600), -R(600)],
    ])
  })

  it('has drivers that sum exactly to the change in left over', () => {
    expect(e.drivers.reduce((sum, d) => sum + d.effectCents, 0)).toBe(e.leftOverChangeCents)
  })

  it('holds that invariant for arbitrary months', () => {
    let seed = 42
    const rand = (n: number) => (seed = (seed * 1103515245 + 12345) % 2 ** 31) % n
    const kinds = ['income', 'spend', 'refund', 'transfer'] as const
    const categories = ['income', 'medical', 'groceries', 'baby', 'transport']
    for (let i = 0; i < 200; i++) {
      const random: TotalRow[] = Array.from({ length: 12 }, () => ({
        month: rand(2) ? '2026-01' : '2026-02',
        category: categories[rand(categories.length)]!,
        kind: kinds[rand(kinds.length)]!,
        cents: 1 + rand(1_000_000),
      }))
      const x = explainChange(monthTotals('2026-01', random), monthTotals('2026-02', random))
      if (!x) continue
      expect(x.drivers.reduce((sum, d) => sum + d.effectCents, 0)).toBe(x.leftOverChangeCents)
    }
  })

  it('marks a category with a zero baseline as new', () => {
    const curr = monthTotals('2026-10', [...rows, { month: '2026-10', category: 'baby', kind: 'spend', cents: R(300) }])
    const baby = explainChange(sep, curr)!.drivers.find((d) => d.key === 'baby')!
    expect(baby).toMatchObject({ previousCents: 0, currentCents: R(300), isNew: true })
  })

  it('includes a category that dropped to nothing', () => {
    const curr = monthTotals('2026-10', rows.filter((r) => !(r.month === '2026-10' && r.category === 'medical')))
    const medical = explainChange(sep, curr)!.drivers.find((d) => d.key === 'medical')!
    expect(medical).toMatchObject({ changeCents: -R(400), effectCents: R(400), isNew: false })
  })

  it('has no explanation without a usable previous month or for an empty month', () => {
    expect(explainChange(null, oct)).toBeNull()
    expect(explainChange(monthTotals('2026-08', rows), oct)).toBeNull()
    expect(explainChange(oct, monthTotals('2026-11', rows))).toBeNull()
  })
})

describe('describeChange', () => {
  it('produces the brief’s October copy exactly', () => {
    expect(describeChange(sep, oct, explainChange(sep, oct)!)).toEqual({
      headline: 'You had R2,700 less left over in October.',
      causes: 'R600 less came in and you spent R2,100 more than in September.',
    })
  })

  it('describes the reverse direction', () => {
    expect(describeChange(oct, sep, explainChange(oct, sep)!)).toEqual({
      headline: 'You had R2,700 more left over in September.',
      causes: 'R600 more came in and you spent R2,100 less than in October.',
    })
  })

  it('describes no change', () => {
    expect(describeChange(oct, oct, explainChange(oct, oct)!)).toEqual({
      headline: 'You had the same left over in October as in October.',
      causes: 'Money in was unchanged and you spent the same as in October.',
    })
  })
})
