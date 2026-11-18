import type {
  HeroAssetMap,
  HeroPerformanceSource,
  MatchOutcome,
  MatchSummary,
  PlayerIdentitySource,
  PlayerSearchResult,
  RankAssetMap,
} from './models'
import {
  heroAssetSchema,
  matchHistoryEntrySchema,
  rankAssetSchema,
  type HeroStats,
  type SteamProfile,
} from './upstream-schemas'

export function toPlayerSearchResult(profile: SteamProfile): PlayerSearchResult {
  return {
    accountId: profile.account_id,
    displayName: profile.personaname,
    avatarUrl: safeHttpsUrl(profile.avatarfull),
    profileUrl: safeHttpsUrl(profile.profileurl),
  }
}

export function toPlayerIdentity(profile: SteamProfile): PlayerIdentitySource {
  return {
    ...toPlayerSearchResult(profile),
    matchesPlayedLast30Days: profile.matches_played_last_30d,
  }
}

export function toHeroPerformanceSource(stats: HeroStats): HeroPerformanceSource {
  return {
    heroId: stats.hero_id,
    matchesPlayed: stats.matches_played,
    wins: stats.wins,
    kills: stats.kills,
    deaths: stats.deaths,
    assists: stats.assists,
    lastPlayed: stats.last_played,
    timePlayedSeconds: stats.time_played,
  }
}

export function toMatchSummaries(entries: readonly unknown[]): MatchSummary[] {
  return entries.flatMap((entry) => {
    const parsed = matchHistoryEntrySchema.safeParse(entry)
    if (!parsed.success) return []
    const match = parsed.data
    return [
      {
        accountId: match.account_id,
        matchId: String(match.match_id),
        heroId: match.hero_id,
        gameMode: match.game_mode,
        matchMode: match.match_mode,
        startTime: match.start_time,
        durationSeconds: match.match_duration_s,
        outcome: outcomeFromCode(match.player_match_outcome),
        kills: match.player_kills,
        deaths: match.player_deaths,
        assists: match.player_assists,
        netWorth: match.net_worth,
      },
    ]
  })
}

export function buildHeroAssetMap(entries: readonly unknown[]): HeroAssetMap {
  return Object.fromEntries(
    entries.flatMap((entry) => {
      const parsed = heroAssetSchema.safeParse(entry)
      if (!parsed.success) return []
      const hero = parsed.data
      return [
        [
          hero.id,
          {
            id: hero.id,
            name: hero.name,
            imageUrl: safeHttpsUrl(
              hero.images.icon_image_small_webp ?? hero.images.icon_image_small ?? null,
            ),
          },
        ],
      ]
    }),
  )
}

export function buildRankAssetMap(entries: readonly unknown[]): RankAssetMap {
  return Object.fromEntries(
    entries.flatMap((entry) => {
      const parsed = rankAssetSchema.safeParse(entry)
      if (!parsed.success) return []
      const rank = parsed.data
      return [
        [
          rank.tier,
          {
            tier: rank.tier,
            name: rank.name,
            color: rank.color,
            imageUrl: safeHttpsUrl(rank.images.large_webp ?? rank.images.large ?? null),
          },
        ],
      ]
    }),
  )
}

function outcomeFromCode(code: number): MatchOutcome {
  if (code === 1) return 'win'
  if (code === 2) return 'loss'
  return 'unscored'
}

function safeHttpsUrl(value: string | null | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}
