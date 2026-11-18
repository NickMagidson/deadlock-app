import { expect, test } from '@playwright/test'

test('searches by name and preserves results on reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('searchbox', { name: 'Steam name or ID' }).fill('Ivy')
  await page.getByRole('searchbox', { name: 'Steam name or ID' }).press('Enter')

  await expect(page).toHaveURL('/?q=Ivy')
  await expect(page.getByRole('link', { name: /view ivy/i })).toHaveAttribute(
    'href',
    '/players/123',
  )

  await page.reload()
  await expect(page.getByRole('status')).toContainText('1 player found')
})

test('resolves a raw account ID before name search', async ({ page }) => {
  await page.goto('/?q=123')
  await expect(page.getByText('Exact Account')).toBeVisible()
  await expect(page.getByRole('link', { name: /view exact account/i })).toHaveAttribute(
    'href',
    '/players/123',
  )
})

test('falls back to display-name search for numeric text outside ID range', async ({
  page,
}) => {
  await page.goto('/?q=4294967296')
  await expect(page.getByText('4294967296')).toBeVisible()
  await expect(page.getByRole('link', { name: /view 4294967296/i })).toHaveAttribute(
    'href',
    '/players/456',
  )
})
