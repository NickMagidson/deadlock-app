import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import type { MatchPage } from '../../domain/match-window'
import type { MatchFilters as MatchFilterState } from '../../features/matches/match-filters.schema'
import type { MatchSummary } from '../../lib/deadlock/models'
import type { MatchDetailResult } from '../../server/player.service.server'
import { MatchFilters } from './MatchFilters'
import { MatchScoreboard } from './MatchScoreboard'
import { MatchTable } from './MatchTable'

describe('MatchFilters', () => {
  it('labels controls and resets the page while preserving other filters', async () => {
    const user = userEvent.setup()
    let next: MatchFilterState | null = null
    render(
      <MatchFilters
        filters={{ hero: 7, page: 4, result: 'wins' }}
        heroes={[
          { id: 7, name: 'Infernus' },
          { id: 3, name: 'Ivy' },
        ]}
        onChange={(filters) => {
          next = filters
        }}
      />,
    )

    await user.selectOptions(screen.getByRole('combobox', { name: 'Hero' }), '3')
    expect(next).toEqual({ hero: 3, page: 1, result: 'wins' })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Result' }), 'losses')
    expect(next).toEqual({ hero: 7, page: 1, result: 'losses' })
  })
})

describe('MatchTable', () => {
  it('renders a 20-row page with an honest fixed-window disclosure', async () => {
    await renderWithRouter(
      <MatchTable
        accountId={123}
        filters={{ page: 1, result: 'all' }}
        page={matchPage(25, 1)}
      />,
    )

    expect(screen.getAllByRole('row')).toHaveLength(21)
    expect(screen.getByText('Showing matches from the latest 100 available records.')).toBeVisible()
    expect(screen.queryByRole('link', { name: 'Previous page' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Next page' })).toHaveAttribute(
      'href',
      '/players/123/matches?page=2&result=all',
    )
  })

  it('exposes previous and no next link at the final boundary', async () => {
    await renderWithRouter(
      <MatchTable
        accountId={123}
        filters={{ page: 2, result: 'wins' }}
        page={{ ...matchPage(25, 2), hasPrevious: true, hasNext: false }}
      />,
    )

    expect(screen.getByRole('link', { name: 'Previous page' })).toHaveAttribute(
      'href',
      '/players/123/matches?page=1&result=wins',
    )
    expect(screen.queryByRole('link', { name: 'Next page' })).not.toBeInTheDocument()
  })
})

describe('MatchScoreboard', () => {
  it('identifies the routed player in the loaded scoreboard', () => {
    const detail: MatchDetailResult = {
      matchId: '9005',
      player: { accountId: 123, heroId: 7, kills: 19, deaths: 3, assists: 14 },
      participants: [
        { accountId: 123, heroId: 7, kills: 19, deaths: 3, assists: 14 },
        { accountId: 456, heroId: 3, kills: 4, deaths: 6, assists: 8 },
      ],
    }
    render(<MatchScoreboard detail={detail} />)

    expect(screen.getByRole('row', { name: /account 123.*19.*3.*14/i })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })
})

function matchPage(count: number, page: number): MatchPage {
  return {
    items: Array.from({ length: Math.min(20, count) }, (_, index) =>
      match({ matchId: String(9_000 + index) }),
    ),
    page,
    pageSize: 20,
    sampleSize: 100,
    filteredCount: count,
    hasPrevious: page > 1,
    hasNext: count > 20,
  }
}

async function renderWithRouter(element: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => element })
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/players/$accountId/matches/$matchId',
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([detailRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  render(<RouterProvider router={router} />)
  await router.load()
}

function match(overrides: Partial<MatchSummary> = {}): MatchSummary {
  return {
    accountId: 123,
    matchId: '9001',
    heroId: 7,
    gameMode: 1,
    matchMode: 1,
    startTime: 1_799_999_999,
    durationSeconds: 2_340,
    outcome: 'win',
    kills: 19,
    deaths: 3,
    assists: 14,
    netWorth: 63_500,
    ...overrides,
  }
}
