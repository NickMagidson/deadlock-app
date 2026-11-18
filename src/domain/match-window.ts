import type { MatchFilters } from '../features/matches/match-filters.schema'
import type { MatchSummary } from '../lib/deadlock/models'

const NORMAL_GAME_MODE = 1
const UNRANKED_MATCH_MODE = 1
const RANKED_MATCH_MODE = 4
const SAMPLE_SIZE = 100
const PAGE_SIZE = 20

export interface MatchPage {
  items: MatchSummary[]
  page: number
  pageSize: number
  sampleSize: number
  filteredCount: number
  hasPrevious: boolean
  hasNext: boolean
}

export function getMatchPage(
  matches: readonly MatchSummary[],
  filters: MatchFilters,
): MatchPage {
  const sample = [...matches]
    .filter(isEligibleMatch)
    .sort((a, b) => b.startTime - a.startTime)
    .slice(0, SAMPLE_SIZE)
  const filtered = sample.filter((match) => {
    if ('hero' in filters && filters.hero !== undefined && match.heroId !== filters.hero) {
      return false
    }
    if (filters.result === 'wins' && match.outcome !== 'win') return false
    if (filters.result === 'losses' && match.outcome !== 'loss') return false
    return true
  })
  const start = (filters.page - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE

  return {
    items: filtered.slice(start, end),
    page: filters.page,
    pageSize: PAGE_SIZE,
    sampleSize: sample.length,
    filteredCount: filtered.length,
    hasPrevious: filters.page > 1,
    hasNext: end < filtered.length,
  }
}

function isEligibleMatch(match: MatchSummary) {
  return (
    match.gameMode === NORMAL_GAME_MODE &&
    (match.matchMode === UNRANKED_MATCH_MODE || match.matchMode === RANKED_MATCH_MODE) &&
    (match.outcome === 'win' || match.outcome === 'loss')
  )
}
