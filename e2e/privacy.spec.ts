import { expect, test } from '@playwright/test'

test('another customer opening the same links sees only their own money', async ({ page }) => {
  // The exact deep link Thandi uses for her Medical payments.
  const path = '/dashboard?month=2026-10&category=medical'
  await page.goto(path)
  await page.getByLabel('Email address').fill('sam@randsight.example')
  await page.getByLabel('Password').fill('isolation-demo')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(path)

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Kloof Pharmacy')
  await expect(dialog.getByText('Total R120')).toBeVisible()

  // Nothing of Thandi's: not her merchants, her salary, her totals or her name.
  const body = page.locator('body')
  for (const theirs of ['Fernwood Paediatrics', 'Karoo Logistics', 'R10,700', 'R1,600', 'Thandi']) {
    await expect(body, theirs).not.toContainText(theirs)
  }
})
