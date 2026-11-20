import { expect, test, type Page } from '@playwright/test'

async function signIn(page: Page) {
  await page.goto('/sign-in')
  await page.getByLabel('Email address').fill('thandi@randsight.example')
  await page.getByLabel('Password').fill('hindsight-demo')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/dashboard')
}

const isDesktop = (page: Page) => page.viewportSize()!.width >= 1024

test('desktop shows a sidebar; phones show a hamburger menu', async ({ page }) => {
  await signIn(page)
  const nav = page.getByRole('navigation', { name: 'Main' })
  const menuButton = page.getByText('Menu', { exact: true })

  if (isDesktop(page)) {
    await expect(menuButton).toBeHidden()
    await expect(nav.getByRole('link', { name: 'Review' })).toHaveAttribute('aria-current', 'page')
    await expect(nav.getByRole('link', { name: 'Live Track' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
    const box = (await nav.boundingBox())!
    expect(box.x).toBeLessThan(100) // on the left, not across the top
  } else {
    await expect(nav).toBeHidden()
    await menuButton.click()
    await expect(nav.getByRole('link', { name: 'Review' })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(nav).toBeHidden()
    await expect(menuButton).toBeFocused()
  }
})

test('choosing a page from the navigation goes there and closes the menu', async ({ page }) => {
  await signIn(page)
  if (!isDesktop(page)) await page.getByText('Menu', { exact: true }).click()
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Live Track' }).click()

  await expect(page).toHaveURL('/dashboard/live-track')
  await expect(page.getByRole('heading', { level: 1, name: 'Live Track' })).toBeVisible()
  if (!isDesktop(page)) await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
