export interface PlayerSearchResult {
  accountId: number
  displayName: string
  avatarUrl: string | null
  profileUrl: string | null
}

export interface PlayerIdentitySource extends PlayerSearchResult {
  matchesPlayedLast30Days: number
}

export interface HeroPerformanceSource {
  heroId: number
  matchesPlayed: number
  wins: number
  kills: number
  deaths: number
  assists: number
  lastPlayed: number
  timePlayedSeconds: number
}

export type MatchOutcome = 'win' | 'loss' | 'unscored'

export interface MatchSummary {
  accountId: number
  matchId: string
  heroId: number
  gameMode: number
  matchMode: number
  startTime: number
  durationSeconds: number
  outcome: MatchOutcome
  kills: number
  deaths: number
  assists: number
  netWorth: number
}

export interface HeroAsset {
  id: number
  name: string
  imageUrl: string | null
}

export interface RankAsset {
  tier: number
  name: string
  color: string
  imageUrl: string | null
}

export type HeroAssetMap = Record<number, HeroAsset>
export type RankAssetMap = Record<number, RankAsset>
