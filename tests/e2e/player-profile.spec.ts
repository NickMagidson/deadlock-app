import { expect, test } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

test('serves a meaningful profile document and completes streamed sections', async ({
  page,
  request,
}) => {
  const response = await request.get('/players/123')
  const html = await response.text()
  expect(html).toContain('Exact Account')
  expect(html).toContain('Phantom')

  await page.goto('/players/123')
  await expect(page.getByRole('heading', { level: 1, name: 'Exact Account' })).toBeVisible()
  await expect(page.getByText('Player archive · Account 123')).toHaveCSS(
    'text-transform',
    'uppercase',
  )
  await expect(page.getByRole('heading', { name: 'Infernus' })).toBeVisible()
  await expect(page.getByText('3 straight wins in the latest available matches.')).toBeVisible()
  await expect(page.getByText('19 / 3 / 14').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Standout matches' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Explore all matches →' })).toHaveAttribute(
    'href',
    '/players/123/matches?page=1&result=all',
  )
})

test('isolates a streamed section failure and retries it', async ({ page }) => {
  await page.goto('/players/999')

  await expect(page.getByRole('heading', { level: 1, name: 'RetryPlayer' })).toBeVisible()
  const retry = page.getByRole('button', { name: 'Retry hero performance' })
  await expect(retry).toBeVisible({ timeout: 15_000 })
  await retry.click()
  await expect(page.getByRole('heading', { name: 'Infernus' })).toBeVisible()
})

test('rejects an invalid account before making an upstream request', async ({
  page,
  request,
}) => {
  const before = await (await request.get('http://127.0.0.1:3100/counts')).json()
  await page.goto('/players/not-an-account')
  await expect(page.getByRole('heading', { name: 'This record could not be found' })).toBeVisible()
  const after = await (await request.get('http://127.0.0.1:3100/counts')).json()
  expect(after.api).toBe(before.api)
})
