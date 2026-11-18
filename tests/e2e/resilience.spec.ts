import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('resilient search states', () => {
  test('handles invalid and empty-result searches without leaking provider details', async ({ page }) => {
    await page.goto(`/?q=${'x'.repeat(101)}`)
    await expect(page.getByText('Search by Steam name or ID to begin.')).toBeVisible()

    await page.goto('/?q=Nobody')
    await expect(page.getByRole('status')).toContainText('No players found for “Nobody”')
  })

  for (const scenario of [
    ['Missing', 'No matching Deadlock record was found.'],
    ['RateLimit', 'Deadlock is busy.'],
    ['Busy', 'Deadlock is busy.'],
    ['Timeout', 'Deadlock is temporarily unavailable.'],
    ['Malformed', 'The player archive returned an unexpected response.'],
    ['Offline', 'Deadlock could not be reached.'],
  ] as const) {
    test(`maps ${scenario[0]} failures to safe UI`, async ({ page }) => {
      await page.goto(`/?q=${scenario[0]}`)
      await expect(page.getByRole('alert')).toContainText(scenario[1])
      await expect(page.getByRole('alert')).not.toContainText('try later')
    })
  }

  test('shows retry delay and recovers through a keyboard-focusable retry', async ({ page }) => {
    await page.goto('/?q=Recover')
    await expect(page.getByText('Try again in 7 seconds.')).toBeVisible()
    const retry = page.getByRole('button', { name: 'Try again' })
    await expect(retry).toBeEnabled()
    await retry.focus()
    await expect(retry).toBeFocused()
    expect(await retry.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none')
    await retry.press('Enter')
    await expect(page.getByRole('link', { name: 'View Recovered Player' })).toBeVisible()
  })
})

test('provides document landmarks, skip navigation, and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?q=Ivy')
  await expect(page.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main-content')
  await expect(page.locator('main#main-content')).toHaveCount(1)
  const duration = await page.getByRole('link', { name: 'View Ivy' }).evaluate(
    (element) => getComputedStyle(element).transitionDuration,
  )
  expect(Number.parseFloat(duration)).toBe(0.00001)
})

for (const [name, path] of [
  ['search', '/?q=Ivy'],
  ['profile', '/players/123'],
  ['matches', '/players/123/matches'],
] as const) {
  test(`${name} flow has no detectable accessibility violations`, async ({ page }) => {
    await page.goto(path)
    await page.locator('main#main-content').waitFor()
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
}
