// Lighthouse, mobile preset, against a running production server (normally the Docker container).
// Three cold runs per page, each in a fresh browser profile; the dashboard is loaded signed in.
// Usage: docker run --rm -p 3000:3000 randsight, then npm run lighthouse   (results in bench/out/lighthouse.json)
import { chromium } from '@playwright/test'
import lighthouse from 'lighthouse'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const base = process.env.BASE_URL ?? 'http://localhost:3000'
const RUNS = 3
const PORT = 9333

const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]!

async function signedInCookie() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(`${base}/sign-in`)
  await page.getByLabel('Email address').fill('thandi@randsight.example')
  await page.getByLabel('Password').fill('hindsight-demo')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(`${base}/dashboard`)
  const session = (await page.context().cookies()).find((c) => c.name === 'rs_session')
  await browser.close()
  if (!session) throw new Error('Sign-in did not set a session cookie')
  return `rs_session=${session.value}`
}

async function audit(url: string, cookie?: string) {
  const browser = await chromium.launch({ args: [`--remote-debugging-port=${PORT}`] })
  try {
    const result = await lighthouse(url, {
      port: PORT,
      output: 'json',
      logLevel: 'error',
      // A header rather than a stored cookie, so Lighthouse's storage reset (the cold start) doesn't sign it out.
      extraHeaders: cookie ? { Cookie: cookie } : undefined,
    })
    if (!result) throw new Error(`No Lighthouse result for ${url}`)
    const { categories, audits } = result.lhr
    const score = (id: string) => Math.round((categories[id]?.score ?? 0) * 100)
    const value = (id: string) => audits[id]?.numericValue ?? NaN
    return {
      performance: score('performance'),
      accessibility: score('accessibility'),
      bestPractices: score('best-practices'),
      seo: score('seo'),
      fcpMs: Math.round(value('first-contentful-paint')),
      lcpMs: Math.round(value('largest-contentful-paint')),
      tbtMs: Math.round(value('total-blocking-time')),
      cls: Math.round(value('cumulative-layout-shift') * 1000) / 1000,
      transferKb: Math.round(value('total-byte-weight') / 1024),
    }
  } finally {
    await browser.close()
  }
}

const cookie = await signedInCookie()
const pages = [
  { name: 'Landing', url: `${base}/` },
  { name: 'Dashboard (October, signed in)', url: `${base}/dashboard?month=2026-10`, cookie },
]

const results = []
for (const page of pages) {
  const runs: Awaited<ReturnType<typeof audit>>[] = []
  for (let i = 0; i < RUNS; i++) runs.push(await audit(page.url, page.cookie))
  const keys = Object.keys(runs[0]!) as (keyof (typeof runs)[number])[]
  const medians = Object.fromEntries(keys.map((k) => [k, median(runs.map((r) => r[k]))]))
  results.push({ page: page.name, median: medians, runs })
  console.log(page.name, medians)
}

const out = resolve('bench/out')
mkdirSync(out, { recursive: true })
writeFileSync(resolve(out, 'lighthouse.json'), JSON.stringify({ date: new Date().toISOString(), base, results }, null, 2) + '\n')
