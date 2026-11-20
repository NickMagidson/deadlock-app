import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

test('searches by name and preserves results on reload', async ({ page }) => {
  await page.goto('/')
  const input = await hydratedSearchInput(page)
  await input.fill('Ivy')
  await input.press('Enter')

  await expect(page).toHaveURL('/?q=Ivy')
  await expect(page.getByRole('link', { name: /view ivy/i })).toHaveAttribute(
    'href',
    '/players/123',
  )

  await page.reload()
  await expect(page.getByRole('status')).toContainText('1 player found')
})

test('suggests players after typing and waits for Enter to submit', async ({ page }) => {
  await page.goto('/')
  const input = await hydratedSearchInput(page)
  await input.fill('Pl')

  const options = page.getByRole('option')
  await expect(options).toHaveCount(2)
  await expect(options.nth(0)).toContainText('Ivy')
  await expect(options.nth(1)).toContainText('Pocket')
  await expect(options.locator('img')).toHaveCount(2)
  await options.nth(0).click()

  await expect(input).toHaveValue('Ivy')
  await expect(input).toBeFocused()
  await expect(page).toHaveURL('/')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/?q=Ivy')
  await expect(page.getByRole('link', { name: /view ivy/i })).toBeVisible()
})

test('supports keyboard selection without immediate navigation', async ({ page }) => {
  await page.goto('/')
  const input = await hydratedSearchInput(page)
  await input.fill('Pl')
  await expect(page.getByRole('option')).toHaveCount(2)

  await input.press('ArrowDown')
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(input).toHaveValue('Pocket')
  await expect(page).toHaveURL('/')

  await input.press('Enter')
  await expect(page).toHaveURL('/?q=Pocket')
  await expect(page.getByRole('link', { name: /view pocket/i })).toBeVisible()
})

test('submits unmatched text normally', async ({ page }) => {
  await page.goto('/')
  const input = await hydratedSearchInput(page)
  await input.fill('Nobody')
  await expect(page.getByRole('status')).toContainText('No player suggestions')
  await input.press('Enter')

  await expect(page).toHaveURL('/?q=Nobody')
  await expect(page.getByText('No players found for “Nobody”.')).toBeVisible()
})

test('keeps failed suggestions non-blocking', async ({ page }) => {
  await page.goto('/')
  const input = await hydratedSearchInput(page)
  await input.fill('Busy')
  await expect(page.getByRole('status')).toContainText(
    'Suggestions unavailable. You can still search.',
  )
  await input.press('Enter')

  await expect(page).toHaveURL('/?q=Busy')
  await expect(page.getByRole('alert')).toContainText('Deadlock is busy')
})

test('keeps the suggestion popup inside a 320px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto('/')
  await (await hydratedSearchInput(page)).fill('Pl')
  const popup = page.getByRole('listbox', { name: 'Player suggestions' })
  await expect(popup).toBeVisible()

  const box = await popup.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(320)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
})

test('supports popup bounds, dismissal, and clearing from the keyboard', async ({ page }) => {
  await page.goto('/')
  const input = await hydratedSearchInput(page)
  await input.fill('Pl')
  await expect(page.getByRole('status')).toContainText('Searching players')
  const options = page.getByRole('option')
  await expect(options).toHaveCount(2)

  await input.press('End')
  await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true')
  await input.press('Home')
  await expect(options.nth(0)).toHaveAttribute('aria-selected', 'true')
  await input.press('Escape')
  await expect(page.getByRole('listbox')).toHaveCount(0)
  await expect(input).toHaveValue('Pl')

  await input.fill('')
  await expect(page.getByRole('status')).toHaveCount(0)
  await expect(input).toHaveAttribute('aria-expanded', 'false')
})

test('open suggestion popup has no detectable accessibility violations', async ({ page }) => {
  await page.goto('/')
  await (await hydratedSearchInput(page)).fill('Pl')
  await expect(page.getByRole('listbox', { name: 'Player suggestions' })).toBeVisible()

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('scrolls a keyboard-active suggestion into view', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto('/')
  const input = await hydratedSearchInput(page)
  await input.fill('Many')
  const listbox = page.getByRole('listbox', { name: 'Player suggestions' })
  const options = page.getByRole('option')
  await expect(options).toHaveCount(10)
  await input.press('End')

  await expect(options.nth(9)).toHaveAttribute('aria-selected', 'true')
  await expect.poll(async () => listbox.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
  const listboxBox = await listbox.boundingBox()
  const activeBox = await options.nth(9).boundingBox()
  expect(listboxBox).not.toBeNull()
  expect(activeBox).not.toBeNull()
  expect(activeBox!.y).toBeGreaterThanOrEqual(listboxBox!.y)
  expect(activeBox!.y + activeBox!.height).toBeLessThanOrEqual(
    listboxBox!.y + listboxBox!.height,
  )
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

  await expect(page.getByRole('combobox', { name: 'Steam name or ID' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Search' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
})

test('keeps empty guidance in flow above the footer on a short viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 667, height: 375 })
  await page.goto('/')

  const guidance = await page
    .getByText('Search by Steam name or ID to begin.')
    .boundingBox()
  const footer = await page.locator('.landing__footer').boundingBox()

  expect(guidance).not.toBeNull()
  expect(footer).not.toBeNull()
  expect(guidance!.y + guidance!.height).toBeLessThanOrEqual(footer!.y)
})

test('keeps search instructions at readable contrast', async ({ page }) => {
  await page.goto('/')

  const colors = await page.getByRole('combobox', { name: 'Steam name or ID' }).evaluate(
    (input) => ({
      placeholder: getComputedStyle(input, '::placeholder').color,
      pill: getComputedStyle(input.parentElement!).backgroundColor,
      hint: getComputedStyle(input.closest('form')!.querySelector('p')!).color,
      page: getComputedStyle(document.documentElement).backgroundColor,
    }),
  )

  expect(contrastRatio(colors.placeholder, colors.pill)).toBeGreaterThanOrEqual(4.5)
  expect(contrastRatio(colors.hint, colors.page)).toBeGreaterThanOrEqual(4.5)
})

function contrastRatio(foreground: string, background: string) {
  const luminance = (color: string) => {
    const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((channel) => {
      const normalized = channel / 255
      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  }
  const light = luminance(foreground)
  const dark = luminance(background)
  return (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05)
}

async function hydratedSearchInput(page: Page) {
  const input = page.getByRole('combobox', { name: 'Steam name or ID' })
  await expect(input).toHaveAttribute('data-hydrated', 'true')
  return input
}
