// @vitest-environment node

import { describe, expect, it } from 'vitest'

import type {
  HeroAssetMap,
  HeroPerformanceSource,
  MatchSummary,
  PlayerIdentitySource,
  PlayerSearchResult,
  RankAssetMap,
} from '../lib/deadlock/models'
import {
  PlayerServiceError,
  createPlayerService,
  type DeadlockPort,
  type MatchDetailSource,
  type RankSource,
} from './player.service.server'
import { createRequestCache } from './request-cache.server'

describe('player service search', () => {
  it('short-circuits an empty query without touching the port', async () => {
    const port = fakePort()

    await expect(service(port).searchPlayers({ query: '   ' })).resolves.toEqual([])
    expect(port.calls).toEqual([])
  })

  it('uses an exact account lookup for a recognized ID', async () => {
    const port = fakePort({ profile: identity() })

    await expect(service(port).searchPlayers({ query: '[U:1:123]' })).resolves.toEqual([
      searchResult(),
    ])
    expect(port.calls).toEqual(['profile:123'])
  })

  it('falls back to the original text when an exact ID has no profile', async () => {
    const port = fakePort({ profile: null, search: [searchResult()] })

    await service(port).searchPlayers({ query: '123' })

    expect(port.calls).toEqual(['profile:123', 'search:123:10'])
  })

  it('limits display-name results to ten', async () => {
    const results = Array.from({ length: 12 }, (_, index) =>
      searchResult({ accountId: index + 1 }),
    )
    const port = fakePort({ search: results })

    await expect(service(port).searchPlayers({ query: 'Ivy' })).resolves.toHaveLength(10)
    expect(port.calls).toEqual(['search:Ivy:10'])
  })
})

describe('player service composition', () => {
  it('starts identity, rank, and rank assets together', async () => {
    const started: string[] = []
    const releases: Array<() => void> = []
    const pause = (name: string) =>
      new Promise<void>((resolve) => {
        started.push(name)
        releases.push(resolve)
      })
    const port = fakePort()
    port.getSteamProfile = async () => {
      await pause('profile')
      return identity()
    }
    port.getRank = async () => {
      await pause('rank')
      return rank()
    }
    port.getRankAssets = async () => {
      await pause('rank-assets')
      return rankAssets()
    }

    const pending = service(port).getPlayerSummary({ accountId: 123 })
    await Promise.resolve()
    expect(started).toEqual(['profile', 'rank', 'rank-assets'])
    releases.forEach((release) => release())

    await expect(pending).resolves.toEqual({
      identity: identity(),
      rank: {
        badge: 54,
        tier: 5,
        subrank: 4,
        name: 'Phantom',
        color: '#8b70bd',
        imageUrl: 'https://assets.example.com/phantom.webp',
      },
    })
  })

  it('enriches hero statistics from the static asset lookup', async () => {
    const port = fakePort({
      heroStats: [heroStats()],
      heroAssets: {
        7: { id: 7, name: 'Infernus', imageUrl: 'https://assets.example.com/hero.webp' },
      },
    })

    await expect(service(port).getPlayerHeroStats({ accountId: 123 })).resolves.toEqual([
      {
        ...heroStats(),
        name: 'Infernus',
        imageUrl: 'https://assets.example.com/hero.webp',
      },
    ])
    expect(port.calls).toEqual(['hero-stats:123', 'hero-assets'])
  })

  it('applies filters and pagination to a fixed 100-match window', async () => {
    const history = Array.from({ length: 101 }, (_, index) =>
      match({
        matchId: String(index + 1),
        startTime: index + 1,
        heroId: index % 2 === 0 ? 7 : 3,
        outcome: index % 3 === 0 ? 'loss' : 'win',
      }),
    )
    const port = fakePort({ history })

    const page = await service(port).getPlayerMatches({
      accountId: 123,
      hero: 7,
      page: 2,
      result: 'wins',
    })

    expect(page.page).toBe(2)
    expect(page.sampleSize).toBe(100)
    expect(page.items.every((item) => item.heroId === 7 && item.outcome === 'win')).toBe(
      true,
    )
    expect(port.calls).toEqual(['history:123'])
  })

  it('returns not-found when the routed player is absent from match metadata', async () => {
    const port = fakePort({
      matchDetail: {
        matchId: '9001',
        participants: [{ accountId: 456, heroId: 3, kills: 4, deaths: 5, assists: 6 }],
      },
    })

    await expect(
      service(port).getMatchDetail({ accountId: 123, matchId: '9001' }),
    ).rejects.toBeInstanceOf(PlayerServiceError)
    await expect(
      service(port).getMatchDetail({ accountId: 123, matchId: '9001' }),
    ).rejects.toMatchObject({ code: 'not-found' })
  })
})

interface FakePort extends DeadlockPort {
  calls: string[]
}

function service(port: DeadlockPort) {
  return createPlayerService(port, createRequestCache())
}

function fakePort(
  values: {
    profile?: PlayerIdentitySource | null
    search?: PlayerSearchResult[]
    rank?: RankSource
    rankAssets?: RankAssetMap
    heroStats?: HeroPerformanceSource[]
    heroAssets?: HeroAssetMap
    history?: MatchSummary[]
    matchDetail?: MatchDetailSource
  } = {},
): FakePort {
  const calls: string[] = []
  return {
    calls,
    async searchSteam(query, limit) {
      calls.push(`search:${query}:${limit}`)
      return values.search ?? []
    },
    async getSteamProfile(accountId) {
      calls.push(`profile:${accountId}`)
      return values.profile === undefined ? identity() : values.profile
    },
    async getRank(accountId) {
      calls.push(`rank:${accountId}`)
      return values.rank ?? rank()
    },
    async getRankAssets() {
      calls.push('rank-assets')
      return values.rankAssets ?? rankAssets()
    },
    async getHeroStats(accountId) {
      calls.push(`hero-stats:${accountId}`)
      return values.heroStats ?? []
    },
    async getHeroAssets() {
      calls.push('hero-assets')
      return values.heroAssets ?? {}
    },
    async getMatchHistory(accountId) {
      calls.push(`history:${accountId}`)
      return values.history ?? []
    },
    async getMatchMetadata(matchId) {
      calls.push(`match:${matchId}`)
      return (
        values.matchDetail ?? {
          matchId,
          participants: [
            { accountId: 123, heroId: 7, kills: 10, deaths: 2, assists: 5 },
          ],
        }
      )
    },
  }
}

function identity(overrides: Partial<PlayerIdentitySource> = {}): PlayerIdentitySource {
  return {
    ...searchResult(),
    matchesPlayedLast30Days: 24,
    ...overrides,
  }
}

function searchResult(overrides: Partial<PlayerSearchResult> = {}): PlayerSearchResult {
  return {
    accountId: 123,
    displayName: 'ExamplePlayer',
    avatarUrl: 'https://cdn.example.com/avatar.jpg',
    profileUrl: 'https://steamcommunity.com/profiles/example',
    ...overrides,
  }
}

function rank(): RankSource {
  return { badge: 54, tier: 5, subrank: 4 }
}

function rankAssets(): RankAssetMap {
  return {
    5: {
      tier: 5,
      name: 'Phantom',
      color: '#8b70bd',
      imageUrl: 'https://assets.example.com/phantom.webp',
    },
  }
}

function heroStats(): HeroPerformanceSource {
  return {
    heroId: 7,
    matchesPlayed: 20,
    wins: 12,
    kills: 160,
    deaths: 80,
    assists: 210,
    lastPlayed: 100,
    timePlayedSeconds: 48_000,
  }
}

function match(overrides: Partial<MatchSummary> = {}): MatchSummary {
  return {
    accountId: 123,
    matchId: '1',
    heroId: 7,
    gameMode: 1,
    matchMode: 1,
    startTime: 1,
    durationSeconds: 2_000,
    outcome: 'win',
    kills: 10,
    deaths: 2,
    assists: 5,
    netWorth: 50_000,
    ...overrides,
  }
}
