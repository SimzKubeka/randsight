import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Browser, type Page } from '@playwright/test'

const PATH = '/dashboard/live-track'

async function signInTo(page: Page) {
  await page.goto(PATH)
  await page.getByLabel('Email address').fill('thandi@randsight.example')
  await page.getByLabel('Password').fill('hindsight-demo')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(PATH)
}

async function newSession(browser: Browser) {
  const page = await (await browser.newContext()).newPage()
  await signInTo(page)
  return page
}

const noViolations = async (page: Page) => expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])

test('applying the sample payment updates November, once, for this session only', async ({ page, browser }) => {
  await signInTo(page)
  const main = page.getByRole('main')
  const allowance = page.locator('[aria-live="polite"]')
  await expect(page.getByText('Simulated bank feed · 20 November 2026')).toBeVisible()
  await expect(allowance).toHaveText(/R2,200\s*Left to spend on groceries in November/)
  await expect(main).toContainText('R3,800 of R6,000 spent')
  await expect(main).toContainText('R200 below an even pace for 20 November')
  await page.getByText('How is this worked out?').click()
  await expect(main).toContainText('An even pace through day 20 of 30 is R4,000')
  const forecast = page.getByRole('region', { name: 'Where November is heading' })
  await expect(forecast).toContainText('On track')
  await expect(forecast).toContainText('If spending continues at this rate, you’d spend about R5,700 by 30 November: R300 under your target.')
  await expect(page.getByRole('img', { name: /R3,800 by 20 November.*about R5,700/ })).toBeVisible()
  await expect(main).toContainText('Up to R220 a day for the next 10 days keeps you within your target.')
  await expect(page.getByRole('region', { name: 'Where these payments come from' })).toContainText('Simulated')
  await noViolations(page)

  await page.getByRole('button', { name: 'Apply sample payment · R450 at Marula Market' }).click()
  // The figure is a polite live region, so its new value is announced.
  await expect(allowance).toHaveText(/R1,750\s*Left to spend on groceries in November/)
  await expect(main).toContainText('R4,250 of R6,000 spent')
  await expect(main).toContainText('R250 above an even pace for 20 November')
  // One payment tips the month-end estimate over the target.
  await expect(forecast).toContainText('Heading over target')
  await expect(forecast).toContainText('about R6,375 by 30 November: R375 over your target.')
  await expect(main).toContainText('Up to R175 a day')
  await expect(page.getByRole('button', { name: 'Sample payment applied' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Reset simulation' })).toBeFocused()
  const payments = page.getByRole('list', { name: 'November groceries' }).getByRole('listitem')
  await expect(payments).toHaveCount(5)
  await expect(payments.first()).toContainText(/Marula Market\s*New/)
  await noViolations(page)

  // Still applied after a reload, and still counted once.
  await page.reload()
  await expect(allowance).toContainText('R1,750')

  // Another session for the same customer is untouched.
  const other = await newSession(browser)
  await expect(other.locator('[aria-live="polite"]')).toContainText('R2,200')

  await page.getByRole('button', { name: 'Reset simulation' }).click()
  await expect(allowance).toContainText('R2,200')
  await expect(main).toContainText('R3,800 of R6,000 spent')
  await expect(page.getByRole('button', { name: /Apply sample payment/ })).toBeFocused()
  await expect(payments).toHaveCount(4)
})
