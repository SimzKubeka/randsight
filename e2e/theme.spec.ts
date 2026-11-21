import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Mid-fade text has a lower contrast than its resting colour, so let finite load animations finish first.
const settle = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== 'running' || !(a.timeline instanceof DocumentTimeline) || a.effect?.getComputedTiming().iterations === Infinity),
  )

async function noViolations(page: Page, label: string) {
  await expect(page).toHaveTitle(/RandSight/)
  await settle(page)
  expect((await new AxeBuilder({ page }).analyze()).violations, label).toEqual([])
}

test.describe('with the system set to dark', () => {
  test.use({ colorScheme: 'dark' })

  test('every screen turns dark and stays readable', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await noViolations(page, 'landing')

    await page.goto('/no-such-page')
    await noViolations(page, '404')

    await page.goto('/dashboard?month=2026-10&category=medical')
    await noViolations(page, 'sign-in')
    await page.getByLabel('Email address').fill('thandi@randsight.example')
    await page.getByLabel('Password').fill('hindsight-demo')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('dialog', { name: 'Medical spending rose by R1,200.' })).toBeVisible()
    await noViolations(page, 'review with the Medical dialog')
  })
})

test('the theme toggle switches, says which theme is on and remembers it', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')
  const toggle = page.getByRole('banner').getByRole('button', { name: 'Dark theme' })
  await expect(html).toHaveAttribute('data-theme', 'light')
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')

  await toggle.click()
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')

  // Remembered over the light system setting, from the first paint.
  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')

  await toggle.click()
  await expect(html).toHaveAttribute('data-theme', 'light')
})
