import type { HeroPerformanceSource, MatchSummary } from '../lib/deadlock/models'

const MIN_STREAK = 3
const MIN_SPECIALIST_MATCHES = 10
const SPECIALIST_LEAD_FACTOR = 1.5
const MIN_MATCH_SAMPLE = 5
const HIGH_IMPACT_FACTOR = 1.5
const MIN_HIGH_IMPACT_CONTRIBUTIONS = 20

export type AchievementKind =
  | 'win-streak'
  | 'hero-specialist'
  | 'high-impact'
  | 'survivor'

export interface PlayerAchievement {
  kind: AchievementKind
  title: string
  description: string
  evidence: string
  heroId?: number
  matchId?: string
}

export interface ScoredMatch {
  match: MatchSummary
  score: number
}

interface AchievementInput {
  heroes: readonly HeroPerformanceSource[]
  matches: readonly MatchSummary[]
}

export function generateAchievements({
  heroes,
  matches,
}: AchievementInput): PlayerAchievement[] {
  const scoredMatches = [...matches]
    .filter((match) => match.outcome === 'win' || match.outcome === 'loss')
    .sort((a, b) => b.startTime - a.startTime)
  const achievements: Array<PlayerAchievement | null> = [
    winStreakAchievement(scoredMatches),
    specialistAchievement(heroes),
    highImpactAchievement(scoredMatches),
    survivorAchievement(scoredMatches),
  ]
  return achievements.filter(
    (achievement): achievement is PlayerAchievement => achievement !== null,
  )
}

export function scoreStandoutMatches(matches: readonly MatchSummary[]): ScoredMatch[] {
  return matches
    .filter((match) => match.outcome === 'win' || match.outcome === 'loss')
    .map((match) => ({
      match,
      score:
        (match.outcome === 'win' ? 100 : 0) +
        ((match.kills + match.assists) / Math.max(1, match.deaths)) * 10 +
        match.netWorth / 1_000,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.match.startTime - a.match.startTime ||
        compareMatchIdsDescending(a.match.matchId, b.match.matchId),
    )
}

function winStreakAchievement(matches: readonly MatchSummary[]) {
  if (matches.length < MIN_STREAK) return null
  const streak = matches.findIndex((match) => match.outcome !== 'win')
  const wins = streak === -1 ? matches.length : streak
  if (wins < MIN_STREAK) return null
  return {
    kind: 'win-streak' as const,
    title: `${wins}-match winning streak`,
    description: 'A run of victories leads the latest available record.',
    evidence: `${wins} straight wins in the latest available matches.`,
  }
}

function specialistAchievement(heroes: readonly HeroPerformanceSource[]) {
  const [leader, runnerUp] = [...heroes].sort(
    (a, b) => b.matchesPlayed - a.matchesPlayed || b.wins - a.wins,
  )
  if (!leader || leader.matchesPlayed < MIN_SPECIALIST_MATCHES) return null
  if (runnerUp && leader.matchesPlayed < runnerUp.matchesPlayed * SPECIALIST_LEAD_FACTOR) {
    return null
  }
  return {
    kind: 'hero-specialist' as const,
    title: 'Signature hero',
    description: 'One hero clearly leads the available match sample.',
    evidence: `${leader.matchesPlayed} recorded matches and ${leader.wins} wins on hero ${leader.heroId}.`,
    heroId: leader.heroId,
  }
}

function highImpactAchievement(matches: readonly MatchSummary[]) {
  if (matches.length < MIN_MATCH_SAMPLE) return null
  const average =
    matches.reduce((sum, match) => sum + match.kills + match.assists, 0) / matches.length
  const standout = [...matches].sort(
    (a, b) =>
      b.kills + b.assists - (a.kills + a.assists) || b.startTime - a.startTime,
  )[0]
  if (!standout) return null
  const contributions = standout.kills + standout.assists
  if (
    contributions < MIN_HIGH_IMPACT_CONTRIBUTIONS ||
    contributions < average * HIGH_IMPACT_FACTOR
  ) {
    return null
  }
  return {
    kind: 'high-impact' as const,
    title: 'High-impact performance',
    description: 'This match stood well above the recent contribution average.',
    evidence: `${standout.kills} kills and ${standout.assists} assists in match ${standout.matchId}.`,
    matchId: standout.matchId,
  }
}

function survivorAchievement(matches: readonly MatchSummary[]) {
  if (matches.length < MIN_MATCH_SAMPLE) return null
  const survivor = matches
    .filter((match) => match.outcome === 'win' && match.deaths <= 1)
    .sort(
      (a, b) =>
        a.deaths - b.deaths ||
        b.kills + b.assists - (a.kills + a.assists) ||
        b.startTime - a.startTime,
    )[0]
  if (!survivor) return null
  return {
    kind: 'survivor' as const,
    title: survivor.deaths === 0 ? 'Untouchable victory' : 'Hard to kill',
    description: 'A standout win with exceptional survival.',
    evidence: `${survivor.deaths} deaths in a winning match.`,
    matchId: survivor.matchId,
  }
}

function compareMatchIdsDescending(a: string, b: string) {
  const left = BigInt(a)
  const right = BigInt(b)
  return left === right ? 0 : left > right ? -1 : 1
}
