/** Evenly spaced axis values (cents) in steps of 1, 2, 2.5 or 5 × 10ⁿ, with headroom so no point sits on the edge. */
export function niceTicks(minCents: number, maxCents: number, target = 4): number[] {
  const raw = Math.max(maxCents - minCents, 100) / target
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw)!
  let low = Math.floor(minCents / step) * step
  let high = Math.ceil(maxCents / step) * step
  if (low === minCents) low = Math.max(0, low - step)
  if (high === maxCents) high += step
  const ticks: number[] = []
  for (let t = low; t <= high; t += step) ticks.push(t)
  return ticks
}
