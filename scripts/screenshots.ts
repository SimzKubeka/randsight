// Captures product screenshots from a running production server for the landing page and README.
// Usage: npm run build && PORT=3100 npm start, then BASE_URL=http://localhost:3100 npm run screenshots
import { chromium, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const base = process.env.BASE_URL ?? 'http://localhost:3100'
const out = 'public/screens'
mkdirSync(out, { recursive: true })

const browser = await chromium.launch()
// A server whose build changed underneath it serves HTML pointing at missing CSS: never save that.
const failed: string[] = []

async function newPage(options: Parameters<typeof browser.newPage>[0]) {
  const page = await browser.newPage(options)
  page.on('response', (res) => res.status() >= 400 && failed.push(`${res.status()} ${res.url()}`))
  return page
}

async function signIn(page: Page) {
  await page.goto(`${base}/sign-in`)
  await page.getByLabel('Email address').fill('thandi@randsight.example')
  await page.getByLabel('Password').fill('hindsight-demo')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(`${base}/dashboard`)
}

async function shoot(page: Page, name: string, quality: number) {
  // Let load animations finish (the insight dot pulses forever, so skip endless ones), then confirm the stylesheet applied.
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity),
  )
  const styled = await page.evaluate(() => getComputedStyle(document.body).backgroundColor !== 'rgba(0, 0, 0, 0)')
  if (!styled || failed.length) throw new Error(`${name}: not saved. ${failed.join(', ') || 'Page is unstyled'}. Rebuild and restart the server.`)
  await page.screenshot({ path: `${out}/${name}`, type: 'jpeg', quality })
}

const desktop = await newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await signIn(desktop)
await shoot(desktop, 'dashboard-desktop.jpg', 82)

const phone = await newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await signIn(phone)
await shoot(phone, 'dashboard-mobile.jpg', 80)
await phone.goto(`${base}/dashboard?month=2026-10&category=medical`)
await shoot(phone, 'medical-mobile.jpg', 80)

await browser.close()
console.log(`Saved screenshots to ${out}/`)
