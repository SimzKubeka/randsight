import AxeBuilder from '@axe-core/playwright'
import { createHash } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { expect, test, type Page } from '@playwright/test'
import { E2E_DATABASE } from '../playwright.config.ts'

const deepLink = '/dashboard?month=2026-10&category=medical'
// Next.js adds its own role="alert" route announcer, so match the summary by its heading.
const problemSummary = (page: Page) => page.getByRole('alert').filter({ hasText: 'There is a problem' })

async function signIn(page: Page, password = 'hindsight-demo') {
  await page.getByLabel('Email address').fill('thandi@randsight.example')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

test('a deep link survives sign-in and refresh', async ({ page }) => {
  await page.goto(deepLink)
  await expect(page).toHaveURL(`/sign-in?next=${encodeURIComponent(deepLink)}`)
  await signIn(page)
  await expect(page).toHaveURL(deepLink)
  await page.reload()
  await expect(page).toHaveURL(deepLink)
})

test('sign-in works with the keyboard alone', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email address').focus()
  await page.keyboard.type('thandi@randsight.example')
  await page.keyboard.press('Tab')
  await page.keyboard.type('hindsight-demo')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/dashboard')
})

test('missing fields and a wrong password show accessible errors', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByRole('button', { name: 'Sign in' }).click()
  const summary = problemSummary(page)
  await expect(summary).toBeFocused()
  await expect(summary).toContainText('Enter your email address')
  await expect(page.getByLabel('Email address')).toHaveAttribute('aria-invalid', 'true')

  await signIn(page, 'wrong-password')
  await expect(problemSummary(page)).toContainText('Email or password is incorrect.')
  await expect(page).toHaveURL(/\/sign-in/)
})

test('an expired session returns to sign-in with a message, then back to the page', async ({ page, context }) => {
  await page.goto(deepLink)
  await signIn(page)
  await expect(page).toHaveURL(deepLink)

  const token = (await context.cookies()).find((c) => c.name === 'rs_session')!.value
  const db = new DatabaseSync(E2E_DATABASE)
  db.exec('PRAGMA busy_timeout = 5000')
  db.prepare('UPDATE sessions SET expires_at = 1 WHERE id = ?').run(createHash('sha256').update(token).digest('hex'))
  db.close()

  await page.reload()
  await expect(page).toHaveURL(/\/sign-in\?next=.*&expired=1/)
  await expect(page.getByText('Your session expired. Sign in again.')).toBeVisible()
  await signIn(page)
  await expect(page).toHaveURL(deepLink)
})

test('sign-out ends the session', async ({ page }) => {
  await page.goto('/sign-in')
  await signIn(page)
  await page.getByText('Menu').click()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL('/sign-in?signed-out=1')
  await expect(page.getByText('You have signed out.')).toBeVisible()
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/sign-in\?next=/)
})

test('an external next address is ignored', async ({ page }) => {
  await page.goto('/sign-in?next=//evil.example')
  await signIn(page)
  await expect(page).toHaveURL('/dashboard')
})

test('private pages are never cached and not indexed', async ({ page, request }) => {
  for (const path of ['/sign-in', '/dashboard']) {
    const res = await request.get(path, { maxRedirects: 0 })
    expect(res.headers()['cache-control'], path).toContain('no-store')
  }
  await page.goto('/sign-in')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
})

test('the sign-in page has no accessibility violations', async ({ page }) => {
  await page.goto('/sign-in')
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(problemSummary(page)).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})
