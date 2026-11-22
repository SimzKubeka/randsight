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

test('public pages fit a phone with text at 200%', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 740 })
    for (const path of ['/', '/docs', '/docs/architecture', '/docs/tech-stack', '/docs/verification', '/sign-in']) {
      await page.goto(path)
      await page.addStyleTag({ content: 'html { font-size: 200% !important }' })
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${path} at ${width}px`).toBe(0)
      // The landing clips sideways, so a heading too wide for its box would be cut off without widening the page.
      // h3 is left out: the feature strip's cards sit off-screen on purpose.
      for (const heading of await page.locator('main :is(h1, h2)').all()) {
        const right = await heading.evaluate((el) => {
          const text = document.createRange()
          text.selectNodeContents(el)
          return text.getBoundingClientRect().right
        })
        expect(right, `${path} at ${width}px: ${await heading.textContent()}`).toBeLessThanOrEqual(width)
      }
    }
  }
})
