import { describe, expect, it } from 'vitest'

import type { HeroPerformanceSource, MatchSummary } from '../lib/deadlock/models'
import { buildPlayerSummary, buildRecentForm } from './player-analytics'

const heroes: HeroPerformanceSource[] = [
  {
    heroId: 7,
    matchesPlayed: 20,
    wins: 12,
    kills: 160,
    deaths: 80,
    assists: 210,
    lastPlayed: 100,
    timePlayedSeconds: 48_000,
  },
  {
    heroId: 3,
    matchesPlayed: 10,
    wins: 4,
    kills: 50,
    deaths: 20,
    assists: 70,
    lastPlayed: 200,
    timePlayedSeconds: 20_000,
  },
]

describe('buildPlayerSummary', () => {
  it('calculates aggregate record and per-match statistics', () => {
    expect(buildPlayerSummary(heroes)).toEqual({
      recordedMatches: 30,
      wins: 16,
      winRate: 16 / 30,
      averageKills: 7,
      averageDeaths: 100 / 30,
      averageAssists: 280 / 30,
      kda: 4.9,
      favoriteHeroes: heroes,
    })
  })

  it('returns null KDA when recorded deaths are zero', () => {
    expect(
      buildPlayerSummary([
        {
          ...heroes[0],
          deaths: 0,
        },
      ]).kda,
    ).toBeNull()
  })

  it('orders favorite heroes by matches, wins, then recent play', () => {
    const tied = [
      { ...heroes[0], heroId: 1, matchesPlayed: 10, wins: 5, lastPlayed: 100 },
      { ...heroes[0], heroId: 2, matchesPlayed: 12, wins: 4, lastPlayed: 100 },
      { ...heroes[0], heroId: 3, matchesPlayed: 10, wins: 6, lastPlayed: 50 },
      { ...heroes[0], heroId: 4, matchesPlayed: 10, wins: 6, lastPlayed: 200 },
    ]

    expect(buildPlayerSummary(tied).favoriteHeroes.map(({ heroId }) => heroId)).toEqual([
      2, 4, 3, 1,
    ])
  })
})

describe('buildRecentForm', () => {
  it('compares the newest ten scored matches with the preceding ten', () => {
    const matches = [
      ...Array.from({ length: 10 }, (_, index) =>
        match({ matchId: String(100 - index), startTime: 100 - index, outcome: 'win' }),
      ),
      ...Array.from({ length: 10 }, (_, index) =>
        match({
          matchId: String(90 - index),
          startTime: 90 - index,
          outcome: 'loss',
          kills: 4,
          deaths: 4,
          assists: 4,
        }),
      ),
    ]

    expect(buildRecentForm(matches)).toEqual({
      matches: 20,
      wins: 10,
      losses: 10,
      winRate: 0.5,
      averageKills: 7,
      averageDeaths: 3,
      averageAssists: 4.5,
      kdaDeltaPercent: 275,
    })
  })

  it('does not claim a ten-vs-ten delta for a smaller sample', () => {
    const matches = Array.from({ length: 19 }, (_, index) =>
      match({ matchId: String(index + 1), startTime: index + 1 }),
    )

    expect(buildRecentForm(matches)?.kdaDeltaPercent).toBeNull()
  })
})

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
