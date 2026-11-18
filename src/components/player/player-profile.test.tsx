import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import type { PlayerAchievement } from '../../domain/achievements'
import type { PlayerStats, RecentForm } from '../../domain/player-analytics'
import type { MatchPage } from '../../domain/match-window'
import type { MatchSummary, PlayerIdentitySource } from '../../lib/deadlock/models'
import type { PlayerSummaryResult } from '../../server/player.service.server'
import { AchievementGrid } from './AchievementGrid'
import { HeroGrid, type EnrichedHero } from './HeroGrid'
import { PlayerHeader } from './PlayerHeader'
import { RecentMatches } from './RecentMatches'
import { SectionBoundary, SectionSkeleton } from './SectionBoundary'
import { StatsOverview } from './StatsOverview'

describe('player profile components', () => {
  it('renders identity, rank, and available-record statistics', () => {
    render(
      <>
        <PlayerHeader summary={summary()} />
        <StatsOverview recentForm={recentForm()} stats={stats()} />
      </>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Ivy' })).toBeVisible()
    expect(screen.getByText('Phantom IV')).toBeVisible()
    expect(screen.getByText('53.3%')).toBeVisible()
    expect(screen.getByText('30 available matches')).toBeVisible()
  })

  it('uses intentional fallbacks for missing images and unranked players', () => {
    render(<PlayerHeader summary={summary({ rank: unranked(), identity: identity({ avatarUrl: null }) })} />)

    expect(screen.getByText('IV')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Unranked')).toBeVisible()
  })

  it('does not fabricate zero-match rates', () => {
    render(
      <StatsOverview
        recentForm={null}
        stats={{ ...stats(), recordedMatches: 0, winRate: null, kda: null }}
      />,
    )

    expect(screen.getAllByText('Not enough data').length).toBeGreaterThan(0)
  })

  it('renders achievement evidence, heroes, and recent matches', () => {
    const achievement: PlayerAchievement = {
      kind: 'win-streak',
      title: '3-match winning streak',
      description: 'A run of victories leads the latest available record.',
      evidence: '3 straight wins in the latest available matches.',
    }
    render(
      <>
        <AchievementGrid achievements={[achievement]} />
        <HeroGrid heroes={[hero()]} />
        <RecentMatches page={matchPage()} />
      </>,
    )

    expect(screen.getByText(achievement.evidence)).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Infernus' })).toBeVisible()
    expect(screen.getByText('19 / 3 / 14')).toBeVisible()
    expect(screen.getByText('Latest 1 available record')).toBeVisible()
  })
})

describe('SectionBoundary', () => {
  it('isolates a failed section and invokes retry', async () => {
    const user = userEvent.setup()
    let retries = 0

    render(
      <SectionBoundary
        name="Hero performance"
        onRetry={() => {
          retries += 1
        }}
      >
        <BrokenSection />
      </SectionBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Hero performance could not be loaded.',
    )
    await user.click(screen.getByRole('button', { name: 'Retry hero performance' }))
    expect(retries).toBe(1)
  })

  it('hides layout skeletons from assistive technology', () => {
    const { container } = render(<SectionSkeleton label="Loading heroes" />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByText('Loading heroes')).not.toBeInTheDocument()
  })
})

function BrokenSection(): never {
  throw new Error('stream failed')
}

function identity(overrides: Partial<PlayerIdentitySource> = {}): PlayerIdentitySource {
  return {
    accountId: 123,
    displayName: 'Ivy',
    avatarUrl: 'https://cdn.example.com/ivy.jpg',
    profileUrl: 'https://steamcommunity.com/profiles/123',
    matchesPlayedLast30Days: 12,
    ...overrides,
  }
}

function unranked(): PlayerSummaryResult['rank'] {
  return { badge: 0, tier: 0, subrank: 0, name: 'Unranked', color: null, imageUrl: null }
}

function summary(overrides: Partial<PlayerSummaryResult> = {}): PlayerSummaryResult {
  return {
    identity: identity(),
    rank: {
      badge: 54,
      tier: 5,
      subrank: 4,
      name: 'Phantom',
      color: '#8b70bd',
      imageUrl: 'https://assets.example.com/phantom.webp',
    },
    ...overrides,
  }
}

function stats(): PlayerStats {
  return {
    recordedMatches: 30,
    wins: 16,
    winRate: 16 / 30,
    averageKills: 7,
    averageDeaths: 100 / 30,
    averageAssists: 280 / 30,
    kda: 4.9,
    favoriteHeroes: [],
  }
}

function recentForm(): RecentForm {
  return {
    matches: 20,
    wins: 10,
    losses: 10,
    winRate: 0.5,
    averageKills: 7,
    averageDeaths: 3,
    averageAssists: 4.5,
    kdaDeltaPercent: 20,
  }
}

function hero(): EnrichedHero {
  return {
    heroId: 7,
    name: 'Infernus',
    imageUrl: null,
    matchesPlayed: 20,
    wins: 12,
    kills: 160,
    deaths: 80,
    assists: 210,
    lastPlayed: 100,
    timePlayedSeconds: 48_000,
  }
}

function match(): MatchSummary {
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
  }
}

function matchPage(): MatchPage {
  return {
    items: [match()],
    page: 1,
    pageSize: 20,
    sampleSize: 1,
    filteredCount: 1,
    hasPrevious: false,
    hasNext: false,
  }
}
