import { expect, test } from '@playwright/test'

test('landing renders without horizontal scroll', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your money, in hindsight.')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('landing fits narrow browser windows, not only phone emulation', async ({ page }) => {
  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 740 })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your money, in hindsight.')
    // clientWidth leaves out a classic scrollbar, which innerWidth would count.
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${width}px`).toBe(0)
  }
})
