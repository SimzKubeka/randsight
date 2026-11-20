// Captures product screenshots from a running production server for the landing page and README.
// Usage: npm run build && PORT=3100 npm start, then BASE_URL=http://localhost:3100 npm run screenshots
import { chromium, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const base = process.env.BASE_URL ?? 'http://localhost:3100'
const out = 'public/screens'
mkdirSync(out, { recursive: true })

async function signIn(page: Page) {
  await page.goto(`${base}/sign-in`)
  await page.getByLabel('Email address').fill('thandi@randsight.example')
  await page.getByLabel('Password').fill('hindsight-demo')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(`${base}/dashboard`)
}

const browser = await chromium.launch()

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await signIn(desktop)
await desktop.screenshot({ path: `${out}/dashboard-desktop.jpg`, type: 'jpeg', quality: 82 })

const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await signIn(phone)
await phone.screenshot({ path: `${out}/dashboard-mobile.jpg`, type: 'jpeg', quality: 80 })
await phone.goto(`${base}/dashboard?month=2026-10&category=medical`)
await phone.screenshot({ path: `${out}/medical-mobile.jpg`, type: 'jpeg', quality: 80 })

await browser.close()
console.log(`Saved screenshots to ${out}/`)
