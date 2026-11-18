import type { HeroPerformanceSource, MatchSummary } from '../lib/deadlock/models'

export interface PlayerStats {
  recordedMatches: number
  wins: number
  winRate: number | null
  averageKills: number | null
  averageDeaths: number | null
  averageAssists: number | null
  kda: number | null
  favoriteHeroes: HeroPerformanceSource[]
}

export interface RecentForm {
  matches: number
  wins: number
  losses: number
  winRate: number
  averageKills: number
  averageDeaths: number
  averageAssists: number
  kdaDeltaPercent: number | null
}

export function buildPlayerSummary(
  heroes: readonly HeroPerformanceSource[],
): PlayerStats {
  const totals = heroes.reduce(
    (summary, hero) => ({
      matches: summary.matches + hero.matchesPlayed,
      wins: summary.wins + hero.wins,
      kills: summary.kills + hero.kills,
      deaths: summary.deaths + hero.deaths,
      assists: summary.assists + hero.assists,
    }),
    { matches: 0, wins: 0, kills: 0, deaths: 0, assists: 0 },
  )

  return {
    recordedMatches: totals.matches,
    wins: totals.wins,
    winRate: divide(totals.wins, totals.matches),
    averageKills: divide(totals.kills, totals.matches),
    averageDeaths: divide(totals.deaths, totals.matches),
    averageAssists: divide(totals.assists, totals.matches),
    kda: totals.deaths === 0 ? null : (totals.kills + totals.assists) / totals.deaths,
    favoriteHeroes: [...heroes].sort(compareFavoriteHeroes),
  }
}

export function buildRecentForm(matches: readonly MatchSummary[]): RecentForm | null {
  const sample = [...matches]
    .filter((match) => match.outcome === 'win' || match.outcome === 'loss')
    .sort((a, b) => b.startTime - a.startTime)
    .slice(0, 20)
  if (sample.length === 0) return null

  const totals = summarizeMatches(sample)
  let kdaDeltaPercent: number | null = null
  if (sample.length === 20) {
    const recentKda = kdaForMatches(sample.slice(0, 10))
    const previousKda = kdaForMatches(sample.slice(10, 20))
    if (recentKda !== null && previousKda !== null && previousKda > 0) {
      kdaDeltaPercent = ((recentKda - previousKda) / previousKda) * 100
    }
  }

  return {
    matches: sample.length,
    wins: totals.wins,
    losses: sample.length - totals.wins,
    winRate: totals.wins / sample.length,
    averageKills: totals.kills / sample.length,
    averageDeaths: totals.deaths / sample.length,
    averageAssists: totals.assists / sample.length,
    kdaDeltaPercent,
  }
}

function compareFavoriteHeroes(a: HeroPerformanceSource, b: HeroPerformanceSource) {
  return (
    b.matchesPlayed - a.matchesPlayed ||
    b.wins - a.wins ||
    b.lastPlayed - a.lastPlayed ||
    a.heroId - b.heroId
  )
}

function summarizeMatches(matches: readonly MatchSummary[]) {
  return matches.reduce(
    (totals, match) => ({
      wins: totals.wins + (match.outcome === 'win' ? 1 : 0),
      kills: totals.kills + match.kills,
      deaths: totals.deaths + match.deaths,
      assists: totals.assists + match.assists,
    }),
    { wins: 0, kills: 0, deaths: 0, assists: 0 },
  )
}

function kdaForMatches(matches: readonly MatchSummary[]) {
  const totals = summarizeMatches(matches)
  return totals.deaths === 0 ? null : (totals.kills + totals.assists) / totals.deaths
}

function divide(numerator: number, denominator: number) {
  return denominator === 0 ? null : numerator / denominator
}
