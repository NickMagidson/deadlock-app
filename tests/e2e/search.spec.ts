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

test('preserves every digit of a SteamID64 in a direct request', async ({ page }) => {
  await page.goto('/?q=76561197960265851')
  await expect(page).toHaveURL('/?q=76561197960265851')
  await expect(page.getByText('Exact Account')).toBeVisible()
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

test('centers the empty search experience at desktop width', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')

  const heading = await page
    .getByRole('heading', { level: 1, name: 'Find your Deadlock story' })
    .boundingBox()
  const search = await page.locator('.player-search__control').boundingBox()

  expect(heading).not.toBeNull()
  expect(search).not.toBeNull()
  expect(Math.abs(heading!.x + heading!.width / 2 - 640)).toBeLessThanOrEqual(2)
  expect(Math.abs(search!.x + search!.width / 2 - 640)).toBeLessThanOrEqual(2)
})

test('compacts the hero and keeps results above the fold after searching', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/?q=Ivy')

  const heading = page.getByRole('heading', {
    level: 1,
    name: 'Find your Deadlock story',
  })
  const firstResult = page.getByRole('link', { name: /view ivy/i })
  const headingBox = await heading.boundingBox()
  const resultBox = await firstResult.boundingBox()

  await expect(page.getByRole('status')).toContainText('1 player found')
  await expect(firstResult).toBeVisible()
  expect(headingBox).not.toBeNull()
  expect(resultBox).not.toBeNull()
  expect(headingBox!.y + headingBox!.height).toBeLessThan(400)
  expect(resultBox!.y + resultBox!.height).toBeLessThanOrEqual(800)
})

test('keeps the search pill usable without overflow at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto('/')

  await expect(page.getByRole('searchbox', { name: 'Steam name or ID' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Search' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
})
