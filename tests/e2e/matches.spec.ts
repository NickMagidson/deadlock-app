import { expect, test } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

test('server-renders the filtered match explorer and updates URL filters', async ({
  page,
  request,
}) => {
  const response = await request.get('/players/123/matches?hero=7&result=wins&page=1')
  expect(await response.text()).toContain('Match explorer')

  await page.goto('/players/123/matches?hero=7&result=wins&page=1')
  await expect(page.getByRole('heading', { level: 1, name: 'Match explorer' })).toBeVisible()
  await expect(page.getByText('Showing matches from the latest 100 available records.')).toBeVisible()
  await page.getByRole('combobox', { name: 'Result' }).selectOption('losses')
  await expect(page).toHaveURL('/players/123/matches?hero=7&page=1&result=losses')
})

test('shows a data-only pending state then the player-focused scoreboard', async ({ page }) => {
  await page.goto('/players/123/matches')
  await page.getByRole('link', { name: 'Open match 9005' }).click()

  await expect(page).toHaveURL('/players/123/matches/9005')
  await expect(page.getByRole('paragraph').filter({ hasText: 'Opening match 9005…' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Match 9005' })).toBeVisible()
  await expect(page.getByRole('row', { name: /account 123.*19.*3.*14/i })).toHaveAttribute(
    'aria-current',
    'true',
  )
})

test('returns not-found when the routed player did not participate', async ({ page }) => {
  await page.goto('/players/123/matches/9999')
  await expect(page.getByRole('heading', { name: 'This record could not be found' })).toBeVisible()
})

test('preserves not-found for absent upstream match metadata', async ({ page }) => {
  const response = await page.goto('/players/123/matches/8888')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'This record could not be found' })).toBeVisible()
})
