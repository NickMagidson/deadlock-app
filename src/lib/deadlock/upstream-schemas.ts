import { z } from 'zod'

const nonNegativeInteger = z.number().int().nonnegative()

export const steamProfileSchema = z
  .object({
    account_id: nonNegativeInteger,
    personaname: z.string(),
    profileurl: z.string(),
    avatar: z.string(),
    avatarmedium: z.string(),
    avatarfull: z.string(),
    last_updated: z.string(),
    friends: z.array(z.unknown()),
    matches_played_last_30d: nonNegativeInteger,
  })
  .passthrough()

export const steamProfilesSchema = z.array(steamProfileSchema)

export const heroStatsSchema = z
  .object({
    account_id: nonNegativeInteger,
    hero_id: nonNegativeInteger,
    matches_played: nonNegativeInteger,
    last_played: nonNegativeInteger,
    time_played: nonNegativeInteger,
    wins: nonNegativeInteger,
    kills: nonNegativeInteger,
    deaths: nonNegativeInteger,
    assists: nonNegativeInteger,
    matches: z.array(nonNegativeInteger),
  })
  .passthrough()

export const heroStatsListSchema = z.array(heroStatsSchema)

export const matchHistoryEntrySchema = z
  .object({
    account_id: nonNegativeInteger,
    match_id: z.number().nonnegative().refine(Number.isInteger),
    hero_id: nonNegativeInteger,
    start_time: nonNegativeInteger,
    player_kills: nonNegativeInteger,
    player_deaths: nonNegativeInteger,
    player_assists: nonNegativeInteger,
    net_worth: nonNegativeInteger,
    match_duration_s: nonNegativeInteger,
    player_match_outcome: nonNegativeInteger,
  })
  .passthrough()

export const matchHistoryResponseSchema = z.array(z.unknown())

export const rankResponseSchema = z
  .object({
    badge: nonNegativeInteger,
    rank: nonNegativeInteger,
    subrank: nonNegativeInteger,
    last_match: z.unknown().nullable().optional(),
  })
  .passthrough()

export const heroAssetSchema = z
  .object({
    id: nonNegativeInteger,
    name: z.string(),
    player_selectable: z.boolean(),
    disabled: z.boolean(),
    images: z
      .object({
        icon_image_small_webp: z.string().nullable().optional(),
        icon_image_small: z.string().nullable().optional(),
      })
      .passthrough(),
  })
  .passthrough()

export const heroAssetsSchema = z.array(heroAssetSchema)

export const rankAssetSchema = z
  .object({
    tier: nonNegativeInteger,
    name: z.string(),
    color: z.string(),
    images: z
      .object({
        large_webp: z.string().nullable().optional(),
        large: z.string().nullable().optional(),
      })
      .passthrough(),
  })
  .passthrough()

export const rankAssetsSchema = z.array(rankAssetSchema)

export type SteamProfile = z.infer<typeof steamProfileSchema>
export type HeroStats = z.infer<typeof heroStatsSchema>
