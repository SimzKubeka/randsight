import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

async function signInAt(page: Page, path: string) {
  await page.goto(path)
  await page.getByLabel('Email address').fill('thandi@randsight.example')
  await page.getByLabel('Password').fill('hindsight-demo')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(path)
}

const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

const medicalRow = (page: Page) => page.getByRole('link', { name: 'Medical spending R1,200 increase' })

test('October answers the question before any chart', async ({ page }) => {
  await signInAt(page, '/dashboard')
  await expect(page.getByRole('heading', { level: 1, name: 'Monthly review' })).toBeVisible()
  await expect(page.getByText('October 2026').first()).toBeVisible()
  await expect(page.getByText('R10,700', { exact: true })).toBeVisible()
  await expect(page.getByText('Left after spending')).toBeVisible()
  await expect(page.getByText('You had R2,700 less left over in October.')).toBeVisible()
  await expect(page.getByText('R600 less came in and you spent R2,100 more than in September.')).toBeVisible()

  const changes = page.getByRole('list', { name: 'What changed' }).getByRole('link')
  await expect(changes).toHaveText([/Salary received.*R600/, /Medical spending.*R1,200/, /Grocery spending.*R900/])

  // On phones the medical row sits above the chart; on desktop the chart is beside the rows.
  if (page.viewportSize()!.width < 1024) {
    const rowTop = (await medicalRow(page).boundingBox())!.y
    const chartTop = (await page.getByRole('img', { name: 'Monthly spending' }).boundingBox())!.y
    expect(rowTop).toBeLessThan(chartTop)
  }
  expect(await noHorizontalScroll(page)).toBe(true)
})

test('Medical opens its payments in a dialog and every way out returns to the same row', async ({ page }) => {
  await signInAt(page, '/dashboard')
  await expect(page).toHaveTitle('Monthly review · RandSight')
  await medicalRow(page).click()

  await expect(page).toHaveURL(/month=2026-10&category=medical/)
  // The tab names the view, never an amount.
  await expect(page).toHaveTitle('Medical spending · Monthly review · RandSight')
  const dialog = page.getByRole('dialog', { name: 'Medical spending rose by R1,200.' })
  await expect(dialog).toBeVisible()
  const heading = dialog.getByRole('heading', { level: 2, name: 'Medical spending rose by R1,200.' })
  await expect(heading).toBeFocused()
  const payments = dialog.getByRole('list', { name: 'October payments' })
  await expect(payments.getByRole('listitem')).toHaveCount(3)
  await expect(payments).toContainText('Fernwood Paediatrics')
  await expect(payments).toContainText(/(^|\D)7 Oct/) // not "07 Oct"
  await expect(payments).toContainText('R950')
  await expect(payments).toContainText('Your note: Six-week check-up')
  await expect(dialog.getByText('Total R1,600')).toBeVisible()
  expect(await noHorizontalScroll(page)).toBe(true)

  // Close button
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(page).not.toHaveURL(/category=/)
  await expect(dialog).toBeHidden()
  await expect(medicalRow(page)).toBeFocused()

  // Escape
  await medicalRow(page).click()
  await expect(heading).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page).not.toHaveURL(/category=/)
  await expect(medicalRow(page)).toBeFocused()

  // Browser Back
  await medicalRow(page).click()
  await expect(heading).toBeFocused()
  await page.goBack()
  await expect(dialog).toBeHidden()
  await expect(medicalRow(page)).toBeFocused()
})

test('a long payment list opens at the top of the dialog', async ({ page }) => {
  await signInAt(page, '/dashboard')
  await page.getByRole('link', { name: 'Grocery spending R900 increase' }).click()
  const heading = page.getByRole('heading', { level: 2, name: 'Grocery spending rose by R900.' })
  await expect(heading).toBeFocused()
  // Wait for the dialog's opening animation; the insight dot pulses for ever, so endless animations don't count.
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getComputedTiming().iterations === Infinity),
  )
  const scrolled = await heading.evaluate((el) => el.closest('dialog')!.firstElementChild!.scrollTop)
  expect(scrolled).toBe(0)
})

test('the dialog is modal: the page behind is out of reach', async ({ page }) => {
  await signInAt(page, '/dashboard?month=2026-10&category=medical')
  const dialog = page.getByRole('dialog', { name: 'Medical spending rose by R1,200.' })
  await expect(dialog).toBeVisible()
  // Server-rendered open; it becomes a true modal once the page hydrates.
  await expect.poll(() => dialog.evaluate((el) => el.matches(':modal'))).toBe(true)
  // Tabbing never reaches the page behind. (After the last control the browser may move focus to its own UI,
  // which the page sees as <body>; that is correct modal behaviour.)
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab')
    const inDialogOrChrome = await page.evaluate(
      () => document.activeElement === document.body || !!document.activeElement?.closest('dialog'),
    )
    expect(inDialogOrChrome).toBe(true)
  }
})

test('a bookmarked Medical view survives refresh and the keyboard reaches it', async ({ page }) => {
  await signInAt(page, '/dashboard?month=2026-10&category=medical')
  await page.reload()
  await expect(page.getByRole('dialog', { name: 'Medical spending rose by R1,200.' })).toBeVisible()

  await page.goto('/dashboard')
  await medicalRow(page).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/category=medical/)
})

test('another month can be chosen and odd parameters fall back safely', async ({ page }) => {
  await signInAt(page, '/dashboard')
  await page.getByText('October 2026', { exact: true }).first().click()
  await page.getByRole('link', { name: 'September 2026' }).click()
  await expect(page).toHaveURL(/month=2026-09/)
  await expect(page.getByText('R13,400', { exact: true })).toBeVisible()

  await page.goto('/dashboard?month=1999-01&category=nonsense&page=-4')
  await expect(page.getByText('R10,700', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Monthly review' })).toBeVisible()
})

test('the spending chart switches to a table with the same numbers and back', async ({ page }) => {
  await signInAt(page, '/dashboard')
  await expect(page.getByText('Spending rose from R16,600 in September to R18,700 in October.')).toBeVisible()
  const views = page.getByRole('group', { name: 'Show spending as' })
  const chart = page.getByRole('img', { name: 'Monthly spending' })
  await expect(views.getByRole('button', { name: 'Chart' })).toHaveAttribute('aria-pressed', 'true')
  await expect(chart).toBeVisible()

  await views.getByRole('button', { name: 'Table' }).click()
  await expect(views.getByRole('button', { name: 'Table' })).toHaveAttribute('aria-pressed', 'true')
  const table = page.getByRole('table', { name: 'Monthly spending' })
  await expect(table.getByRole('row', { name: /September.*R16,600/ })).toBeVisible()
  await expect(table.getByRole('row', { name: /October.*R18,700/ })).toBeVisible()
  await expect(chart).toHaveCount(0)

  await views.getByRole('button', { name: 'Chart' }).click()
  await expect(chart).toBeVisible()
  await expect(table).toHaveCount(0)
})

test('review and detail have no accessibility violations', async ({ page }) => {
  // Next streams metadata on dynamic pages, so wait for the title before auditing.
  await signInAt(page, '/dashboard')
  await expect(page).toHaveTitle(/RandSight/)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.goto('/dashboard?month=2026-10&category=medical')
  await expect(page).toHaveTitle(/RandSight/)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})
