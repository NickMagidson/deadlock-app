export const steamProfileFixture = {
  account_id: 123,
  personaname: 'ExamplePlayer',
  profileurl: 'https://steamcommunity.com/profiles/76561197960265851',
  avatar: 'https://cdn.example.com/avatar-small.jpg',
  avatarmedium: 'https://cdn.example.com/avatar-medium.jpg',
  avatarfull: 'https://cdn.example.com/avatar-full.jpg',
  last_updated: '2026-11-17T20:00:00Z',
  friends: [],
  matches_played_last_30d: 24,
  countrycode: 'US',
  last_team_avg_badge: 54,
  future_provider_field: 'ignored safely',
}

export const heroStatsFixture = {
  account_id: 123,
  hero_id: 7,
  matches_played: 20,
  last_played: 1_799_990_000,
  time_played: 48_000,
  wins: 12,
  kills: 160,
  deaths: 80,
  assists: 210,
  matches: [9001, 9002],
}

export const matchHistoryFixture = {
  account_id: 123,
  match_id: 9_007_199_254_740_992,
  hero_id: 7,
  hero_level: 25,
  start_time: 1_799_999_999,
  game_mode: 1,
  match_mode: 1,
  player_team: 0,
  player_kills: 19,
  player_deaths: 3,
  player_assists: 14,
  denies: 12,
  net_worth: 63_500,
  last_hits: 410,
  match_duration_s: 2_340,
  match_result: 1,
  objectives_mask_team0: 15,
  objectives_mask_team1: 7,
  player_match_outcome: 1,
}

export const rankFixture = {
  badge: 54,
  rank: 5,
  subrank: 4,
  last_match: null,
}

export const heroAssetFixture = {
  id: 7,
  name: 'Infernus',
  player_selectable: true,
  disabled: false,
  images: {
    icon_image_small_webp: 'https://assets.example.com/infernus.webp',
  },
}

export const rankAssetFixture = {
  tier: 5,
  name: 'Phantom',
  color: '#8b70bd',
  images: {
    large_webp: 'https://assets.example.com/phantom.webp',
  },
}
