import { describe, expect, it } from 'vitest'

import {
  heroAssetFixture,
  heroStatsFixture,
  matchHistoryFixture,
  rankAssetFixture,
  steamProfileFixture,
} from '../../test/fixtures/deadlock'
import {
  heroStatsSchema,
  steamProfileSchema,
} from './upstream-schemas'
import {
  buildHeroAssetMap,
  buildRankAssetMap,
  toHeroPerformanceSource,
  toMatchSummaries,
  toPlayerIdentity,
  toPlayerSearchResult,
} from './transforms'

describe('Deadlock transforms', () => {
  it('normalizes a complete Steam profile and ignores future fields', () => {
    const profile = steamProfileSchema.parse(steamProfileFixture)

    expect(toPlayerSearchResult(profile)).toEqual({
      accountId: 123,
      displayName: 'ExamplePlayer',
      avatarUrl: 'https://cdn.example.com/avatar-full.jpg',
      profileUrl: 'https://steamcommunity.com/profiles/76561197960265851',
    })
    expect(toPlayerIdentity(profile)).toEqual({
      accountId: 123,
      displayName: 'ExamplePlayer',
      avatarUrl: 'https://cdn.example.com/avatar-full.jpg',
      profileUrl: 'https://steamcommunity.com/profiles/76561197960265851',
      matchesPlayedLast30Days: 24,
    })
  })

  it('drops unsafe image and profile protocols', () => {
    const profile = steamProfileSchema.parse({
      ...steamProfileFixture,
      avatarfull: 'javascript:alert(1)',
      profileurl: 'http://steam.example.com/player',
    })

    expect(toPlayerSearchResult(profile)).toMatchObject({
      avatarUrl: null,
      profileUrl: null,
    })
  })

  it('preserves the hero statistics used by analytics', () => {
    const stats = heroStatsSchema.parse(heroStatsFixture)

    expect(toHeroPerformanceSource(stats)).toEqual({
      heroId: 7,
      matchesPlayed: 20,
      wins: 12,
      kills: 160,
      deaths: 80,
      assists: 210,
      lastPlayed: 1_799_990_000,
      timePlayedSeconds: 48_000,
    })
  })

  it('filters malformed history entries and keeps match IDs precision-safe', () => {
    expect(
      toMatchSummaries([
        matchHistoryFixture,
        { ...matchHistoryFixture, match_id: 'not-a-match' },
      ]),
    ).toEqual([
      {
        accountId: 123,
        matchId: '9007199254740992',
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
      },
    ])
  })

  it('builds stable hero and rank asset lookup maps', () => {
    expect(buildHeroAssetMap([heroAssetFixture])).toEqual({
      7: {
        id: 7,
        name: 'Infernus',
        imageUrl: 'https://assets.example.com/infernus.webp',
      },
    })
    expect(buildRankAssetMap([rankAssetFixture])).toEqual({
      5: {
        tier: 5,
        name: 'Phantom',
        color: '#8b70bd',
        imageUrl: 'https://assets.example.com/phantom.webp',
      },
    })
  })
})
