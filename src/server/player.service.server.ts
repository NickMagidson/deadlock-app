import { classifySteamQuery } from '../domain/steam-id'
import { getMatchPage, type MatchPage } from '../domain/match-window'
import type { MatchFilters } from '../features/matches/match-filters.schema'
import { deadlockFetch } from '../lib/deadlock/client.server'
import { DeadlockApiError, type DeadlockApiErrorCode } from '../lib/deadlock/errors'
import type {
  HeroAssetMap,
  HeroPerformanceSource,
  MatchSummary,
  PlayerIdentitySource,
  PlayerSearchResult,
  RankAssetMap,
} from '../lib/deadlock/models'
import {
  heroAssetsSchema,
  heroStatsListSchema,
  matchHistoryResponseSchema,
  matchMetadataSchema,
  rankAssetsSchema,
  rankResponseSchema,
  steamProfilesSchema,
} from '../lib/deadlock/upstream-schemas'
import {
  buildHeroAssetMap,
  buildRankAssetMap,
  toHeroPerformanceSource,
  toMatchSummaries,
  toPlayerIdentity,
  toPlayerSearchResult,
} from '../lib/deadlock/transforms'
import type { RequestCache } from './request-cache.server'

export interface RankSource {
  badge: number
  tier: number
  subrank: number
}

export interface MatchParticipant {
  accountId: number
  heroId: number
  kills: number
  deaths: number
  assists: number
}

export interface MatchDetailSource {
  matchId: string
  participants: MatchParticipant[]
}

export interface DeadlockPort {
  searchSteam(query: string, limit: number): Promise<PlayerSearchResult[]>
  getSteamProfile(accountId: number): Promise<PlayerIdentitySource | null>
  getRank(accountId: number): Promise<RankSource>
  getRankAssets(): Promise<RankAssetMap>
  getHeroStats(accountId: number): Promise<HeroPerformanceSource[]>
  getHeroAssets(): Promise<HeroAssetMap>
  getMatchHistory(accountId: number): Promise<MatchSummary[]>
  getMatchMetadata(matchId: string): Promise<MatchDetailSource>
}

export type PlayerServiceErrorCode = DeadlockApiErrorCode | 'invalid-input'

export class PlayerServiceError extends Error {
  readonly code: PlayerServiceErrorCode
  readonly retryAfterSeconds?: number

  constructor(
    code: PlayerServiceErrorCode,
    message: string,
    retryAfterSeconds?: number,
  ) {
    super(message)
    this.name = 'PlayerServiceError'
    this.code = code
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export function createPlayerService(port: DeadlockPort, cache: RequestCache) {
  const cached = <T>(endpoint: string, input: unknown, loader: () => Promise<T>) =>
    cache.getOrCreate(endpoint, input, loader).catch((error) => {
      throw toPlayerServiceError(error)
    })

  return {
    async searchPlayers({ query }: { query: string }) {
      const normalized = query.trim()
      if (!normalized) return []
      const classified = classifySteamQuery(normalized)
      if (classified.kind === 'account-id') {
        const exact = await cached('profile', classified.accountId, () =>
          port.getSteamProfile(classified.accountId),
        )
        if (exact) return [asSearchResult(exact)]
        return (await port.searchSteam(classified.original, 10)).slice(0, 10)
      }
      return (await port.searchSteam(classified.query, 10)).slice(0, 10)
    },

    async getPlayerSummary({ accountId }: { accountId: number }) {
      const [identity, rank, rankAssets] = await Promise.all([
        cached('profile', accountId, () => port.getSteamProfile(accountId)),
        cached('rank', accountId, () => port.getRank(accountId)),
        cached('rank-assets', 'english', () => port.getRankAssets()),
      ])
      if (!identity) {
        throw new PlayerServiceError('not-found', 'This player could not be found.')
      }
      const asset = rankAssets[rank.tier]
      return {
        identity,
        rank: {
          ...rank,
          name: asset?.name ?? (rank.tier === 0 ? 'Unranked' : null),
          color: asset?.color ?? null,
          imageUrl: asset?.imageUrl ?? null,
        },
      }
    },

    async getPlayerHeroStats({ accountId }: { accountId: number }) {
      const [stats, assets] = await Promise.all([
        cached('hero-stats', accountId, () => port.getHeroStats(accountId)),
        cached('hero-assets', 'english-active', () => port.getHeroAssets()),
      ])
      return stats.map((hero) => ({
        ...hero,
        name: assets[hero.heroId]?.name ?? `Hero ${hero.heroId}`,
        imageUrl: assets[hero.heroId]?.imageUrl ?? null,
      }))
    },

    async getPlayerMatches(
      input: { accountId: number } & MatchFilters,
    ): Promise<MatchPage> {
      const history = await cached('match-history', input.accountId, () =>
        port.getMatchHistory(input.accountId),
      )
      return getMatchPage(history, input)
    },

    async getMatchDetail({ accountId, matchId }: { accountId: number; matchId: string }) {
      const detail = await cached('match-metadata', matchId, () =>
        port.getMatchMetadata(matchId),
      )
      const player = detail.participants.find(
        (participant) => participant.accountId === accountId,
      )
      if (!player) {
        throw new PlayerServiceError(
          'not-found',
          'This player did not participate in the requested match.',
        )
      }
      return { ...detail, player }
    },
  }
}

export function createProductionDeadlockPort(): DeadlockPort {
  return {
    async searchSteam(query, limit) {
      const params = new URLSearchParams({ search_query: query, limit: String(limit) })
      const profiles = await deadlockFetch(
        `/v1/players/steam-search?${params}`,
        steamProfilesSchema,
      )
      return profiles.map(toPlayerSearchResult)
    },
    async getSteamProfile(accountId) {
      try {
        const params = new URLSearchParams({ account_ids: String(accountId) })
        const profiles = await deadlockFetch(`/v1/players/steam?${params}`, steamProfilesSchema)
        return profiles[0] ? toPlayerIdentity(profiles[0]) : null
      } catch (error) {
        if (error instanceof DeadlockApiError && error.code === 'not-found') return null
        throw error
      }
    },
    async getRank(accountId) {
      const rank = await deadlockFetch(
        `/v1/players/${accountId}/rank`,
        rankResponseSchema,
      )
      return { badge: rank.badge, tier: rank.rank, subrank: rank.subrank }
    },
    async getRankAssets() {
      const assets = await deadlockFetch('/v1/assets/ranks?language=english', rankAssetsSchema)
      return buildRankAssetMap(assets)
    },
    async getHeroStats(accountId) {
      const params = new URLSearchParams({
        account_ids: String(accountId),
        game_mode: 'normal',
        match_mode: 'ranked,unranked',
      })
      const stats = await deadlockFetch(`/v1/players/hero-stats?${params}`, heroStatsListSchema)
      return stats.map(toHeroPerformanceSource)
    },
    async getHeroAssets() {
      const assets = await deadlockFetch(
        '/v1/assets/heroes?language=english&only_active=true',
        heroAssetsSchema,
      )
      return buildHeroAssetMap(assets)
    },
    async getMatchHistory(accountId) {
      const history = await deadlockFetch(
        `/v1/players/${accountId}/match-history`,
        matchHistoryResponseSchema,
      )
      return toMatchSummaries(history)
    },
    async getMatchMetadata(matchId) {
      const metadata = await deadlockFetch(
        `/v1/matches/${matchId}/metadata?disable_steam=true`,
        matchMetadataSchema,
      )
      return {
        matchId,
        participants: metadata.match_info.players.map((player) => ({
          accountId: player.account_id,
          heroId: player.hero_id,
          kills: player.kills,
          deaths: player.deaths,
          assists: player.assists,
        })),
      }
    },
  }
}

function asSearchResult(identity: PlayerIdentitySource): PlayerSearchResult {
  const { matchesPlayedLast30Days: _ignored, ...result } = identity
  return result
}

function toPlayerServiceError(error: unknown) {
  if (error instanceof PlayerServiceError) return error
  if (error instanceof DeadlockApiError) {
    return new PlayerServiceError(error.code, error.message, error.retryAfterSeconds)
  }
  return new PlayerServiceError('unknown', 'This Deadlock request could not be completed.')
}
