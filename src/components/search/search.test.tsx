import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import type { PlayerSearchResult } from '../../lib/deadlock/models'
import { PlayerSearchForm } from './PlayerSearchForm'
import { SearchResults } from './SearchResults'

describe('PlayerSearchForm', () => {
  it('submits a keyboard-entered query', async () => {
    const user = userEvent.setup()
    let submitted = ''
    render(
      <PlayerSearchForm
        initialQuery=""
        onSubmit={(query) => {
          submitted = query
        }}
      />,
    )

    await user.type(screen.getByRole('searchbox', { name: 'Steam name or ID' }), 'Ivy')
    await user.keyboard('{Enter}')

    expect(submitted).toBe('Ivy')
  })
})

describe('SearchResults', () => {
  it('renders a useful empty state before a search', async () => {
    await renderResults(<SearchResults query="" results={[]} />)
    expect(screen.getByText('Search by Steam name or ID to begin.')).toBeVisible()
  })

  it('announces the result count and provides an intentional avatar fallback', async () => {
    await renderResults(
      <SearchResults
        query="ivy"
        results={[result(), result({ accountId: 456, displayName: 'Pocket' })]}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('2 players found')
    expect(screen.getByText('IV')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('link', { name: /view ivy/i })).toHaveAttribute(
      'href',
      '/players/123',
    )
  })

  it('shows a provider error without exposing technical details', async () => {
    await renderResults(
      <SearchResults
        error="Deadlock is busy. Please try again later."
        query="ivy"
        results={[]}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Deadlock is busy. Please try again later.',
    )
  })
})

async function renderResults(element: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => element })
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/' })
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  render(<RouterProvider router={router} />)
  await router.load()
}

function result(overrides: Partial<PlayerSearchResult> = {}): PlayerSearchResult {
  return {
    accountId: 123,
    displayName: 'Ivy',
    avatarUrl: null,
    profileUrl: 'https://steamcommunity.com/profiles/123',
    ...overrides,
  }
}
