import { describe, expect, it } from 'vitest'

import type { MatchSummary } from '../lib/deadlock/models'
import { getMatchPage } from './match-window'

describe('getMatchPage', () => {
  it('keeps the newest 100 valid normal public matches before paging', () => {
    const matches = [
      match({ matchId: 'private', startTime: 1_000, matchMode: 2 }),
      ...Array.from({ length: 101 }, (_, index) =>
        match({ matchId: String(index + 1), startTime: index + 1 }),
      ),
    ]

    const page = getMatchPage(matches, { page: 1, result: 'all' })

    expect(page.items).toHaveLength(20)
    expect(page.items[0]?.matchId).toBe('101')
    expect(page.items[19]?.matchId).toBe('82')
    expect(page.sampleSize).toBe(100)
    expect(page.filteredCount).toBe(100)
    expect(page.hasPrevious).toBe(false)
    expect(page.hasNext).toBe(true)
    expect(page).not.toHaveProperty('lifetimeTotal')
  })

  it('filters the fixed window before returning a sparse page', () => {
    const matches = Array.from({ length: 40 }, (_, index) =>
      match({
        matchId: String(index + 1),
        startTime: index + 1,
        heroId: index < 3 ? 9 : 7,
        outcome: index % 2 === 0 ? 'win' : 'loss',
      }),
    )

    const page = getMatchPage(matches, {
      hero: 9,
      page: 1,
      result: 'wins',
    })

    expect(page.items.map(({ matchId }) => matchId)).toEqual(['3', '1'])
    expect(page.filteredCount).toBe(2)
    expect(page.hasNext).toBe(false)
  })

  it('excludes invalid modes and unscored outcomes', () => {
    const page = getMatchPage(
      [
        match({ matchId: 'normal' }),
        match({ matchId: 'brawl', gameMode: 4 }),
        match({ matchId: 'bot', matchMode: 3 }),
        match({ matchId: 'unscored', outcome: 'unscored' }),
      ],
      { page: 1, result: 'all' },
    )

    expect(page.items.map(({ matchId }) => matchId)).toEqual(['normal'])
    expect(page.sampleSize).toBe(1)
  })

  it('returns page boundaries in groups of 20', () => {
    const matches = Array.from({ length: 45 }, (_, index) =>
      match({ matchId: String(index + 1), startTime: index + 1 }),
    )

    const page = getMatchPage(matches, { page: 3, result: 'all' })

    expect(page.items).toHaveLength(5)
    expect(page.hasPrevious).toBe(true)
    expect(page.hasNext).toBe(false)
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
