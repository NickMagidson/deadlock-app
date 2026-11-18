import { expect, test } from '@playwright/test'

test('renders the Deadlock application document', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/Deadlock/i)
  await expect(page.getByRole('main')).toHaveCount(1)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Find your Deadlock story' }),
  ).toBeVisible()
})
