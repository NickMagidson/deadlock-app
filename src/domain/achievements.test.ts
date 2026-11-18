import { describe, expect, it } from 'vitest'

import type { HeroPerformanceSource, MatchSummary } from '../lib/deadlock/models'
import { generateAchievements, scoreStandoutMatches } from './achievements'

describe('generateAchievements', () => {
  it('celebrates supported streak, specialist, high-impact, and survivor results', () => {
    const matches = [
      match({ matchId: '5', startTime: 5, kills: 22, assists: 18, deaths: 1 }),
      match({ matchId: '4', startTime: 4, deaths: 0 }),
      match({ matchId: '3', startTime: 3 }),
      match({ matchId: '2', startTime: 2, outcome: 'loss', kills: 3, assists: 2 }),
      match({ matchId: '1', startTime: 1, outcome: 'loss', kills: 2, assists: 3 }),
    ]
    const heroes: HeroPerformanceSource[] = [
      hero({ heroId: 7, matchesPlayed: 20, wins: 13 }),
      hero({ heroId: 3, matchesPlayed: 8, wins: 4 }),
    ]

    const achievements = generateAchievements({ heroes, matches })

    expect(achievements.map(({ kind }) => kind)).toEqual([
      'win-streak',
      'hero-specialist',
      'high-impact',
      'survivor',
    ])
    expect(achievements[0]).toMatchObject({
      evidence: '3 straight wins in the latest available matches.',
    })
    expect(achievements[2]).toMatchObject({ matchId: '5' })
    expect(achievements[3]).toMatchObject({ matchId: '4' })
  })

  it('awards a supported specialist independently of recent match count', () => {
    const achievements = generateAchievements({
      heroes: [hero({ heroId: 7, matchesPlayed: 12 }), hero({ heroId: 3, matchesPlayed: 4 })],
      matches: [match()],
    })
    expect(achievements.map((achievement) => achievement.kind)).toContain('hero-specialist')
  })

  it('suppresses claims when samples do not meet their minimums', () => {
    expect(
      generateAchievements({
        heroes: [hero({ matchesPlayed: 9 })],
        matches: [match(), match({ matchId: '2', outcome: 'loss' })],
      }),
    ).toEqual([])
  })
})

describe('scoreStandoutMatches', () => {
  it('orders by score, then recency, then match ID deterministically', () => {
    const scored = scoreStandoutMatches([
      match({ matchId: '8', startTime: 10 }),
      match({ matchId: '9', startTime: 10 }),
      match({ matchId: '10', startTime: 12, outcome: 'loss' }),
    ])

    expect(scored.map(({ match: value }) => value.matchId)).toEqual(['9', '8', '10'])
    expect(scored[0]?.score).toBe(scored[1]?.score)
  })
})

function hero(overrides: Partial<HeroPerformanceSource> = {}): HeroPerformanceSource {
  return {
    heroId: 7,
    matchesPlayed: 12,
    wins: 7,
    kills: 90,
    deaths: 45,
    assists: 120,
    lastPlayed: 100,
    timePlayedSeconds: 30_000,
    ...overrides,
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
