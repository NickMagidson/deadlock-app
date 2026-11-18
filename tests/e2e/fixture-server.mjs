import { createServer } from 'node:http'

const profiles = {
  Ivy: profile(123, 'Ivy'),
  '123': profile(123, 'Exact Account'),
  '999': profile(999, 'RetryPlayer'),
  '4294967296': profile(456, '4294967296'),
}
let apiCalls = 0
let retryHeroFailures = 0
let recoverSearchFailures = 0

createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1:3100')
  response.setHeader('Content-Type', 'application/json')

  if (url.pathname === '/health') return response.end('{"ok":true}')
  if (url.pathname === '/counts') return response.end(JSON.stringify({ api: apiCalls }))
  apiCalls += 1
  if (url.pathname === '/v1/players/steam-search') {
    const query = url.searchParams.get('search_query') ?? ''
    if (query === 'Missing') {
      response.statusCode = 404
      return response.end('{"error":"not found"}')
    }
    if (query === 'RateLimit' || query === 'Busy' || query === 'Recover') {
      if (query !== 'Recover' || recoverSearchFailures++ === 0) {
        response.statusCode = query === 'RateLimit' ? 429 : 503
        response.setHeader('Retry-After', query === 'Busy' ? '2' : query === 'Recover' ? '1' : '7')
        return response.end('{"error":"try later"}')
      }
      return response.end(JSON.stringify([profile(777, 'Recovered Player')]))
    }
    if (query === 'Timeout') {
      response.statusCode = 504
      return response.end('{"error":"gateway timeout"}')
    }
    if (query === 'Malformed') return response.end('{not-json')
    if (query === 'Offline') return request.socket.destroy()
    return response.end(JSON.stringify(profiles[query] ? [profiles[query]] : []))
  }
  if (url.pathname === '/v1/players/steam') {
    const accountId = url.searchParams.get('account_ids') ?? ''
    return response.end(JSON.stringify(profiles[accountId] ? [profiles[accountId]] : []))
  }
  if (/^\/v1\/players\/\d+\/rank$/.test(url.pathname)) {
    return response.end('{"badge":54,"rank":5,"subrank":4,"last_match":null}')
  }
  if (url.pathname === '/v1/assets/ranks') {
    return response.end(
      JSON.stringify([
        {
          tier: 5,
          name: 'Phantom',
          color: '#8b70bd',
          images: { large_webp: 'https://assets.example.com/phantom.webp' },
        },
      ]),
    )
  }
  if (url.pathname === '/v1/players/hero-stats') {
    const accountId = url.searchParams.get('account_ids')
    if (accountId === '999' && retryHeroFailures++ === 0) {
      response.statusCode = 503
      response.setHeader('Retry-After', '0')
      return response.end('{"error":"busy once"}')
    }
    return response.end(JSON.stringify([heroStats(Number(accountId))]))
  }
  if (url.pathname === '/v1/assets/heroes') {
    return response.end(
      JSON.stringify([
        {
          id: 7,
          name: 'Infernus',
          player_selectable: true,
          disabled: false,
          images: { icon_image_small_webp: 'https://assets.example.com/infernus.webp' },
        },
      ]),
    )
  }
  const historyMatch = /^\/v1\/players\/(\d+)\/match-history$/.exec(url.pathname)
  if (historyMatch) {
    if (historyMatch[1] === '998') {
      response.statusCode = 503
      response.setHeader('Retry-After', '1')
      return response.end('{"error":"history unavailable"}')
    }
    return response.end(
      JSON.stringify(
        Array.from({ length: 5 }, (_, index) => match(Number(historyMatch[1]), 5 - index)),
      ),
    )
  }
  const metadataMatch = /^\/v1\/matches\/(\d+)\/metadata$/.exec(url.pathname)
  if (metadataMatch) {
    const matchId = metadataMatch[1]
    if (matchId === '8888') {
      response.statusCode = 404
      return response.end('{"error":"metadata missing"}')
    }
    const accountId = matchId === '9999' ? 456 : 123
    const payload = {
      match_info: {
        players: [
          { account_id: accountId, hero_id: 7, kills: 19, deaths: 3, assists: 14 },
          { account_id: 456, hero_id: 3, kills: 4, deaths: 6, assists: 8 },
        ],
      },
    }
    return setTimeout(() => response.end(JSON.stringify(payload)), 500)
  }

  response.statusCode = 404
  response.end('{"error":"fixture not found"}')
}).listen(3100, '127.0.0.1')

function profile(accountId, name) {
  return {
    account_id: accountId,
    personaname: name,
    profileurl: `https://steamcommunity.com/profiles/${accountId}`,
    avatar: '',
    avatarmedium: '',
    avatarfull: '',
    last_updated: '2026-11-17T20:00:00Z',
    friends: [],
    matches_played_last_30d: 12,
  }
}

function heroStats(accountId) {
  return {
    account_id: accountId,
    hero_id: 7,
    matches_played: 20,
    last_played: 1_799_999_999,
    time_played: 48_000,
    wins: 13,
    kills: 160,
    deaths: 80,
    assists: 210,
    matches: [9001, 9002],
  }
}

function match(accountId, index) {
  return {
    account_id: accountId,
    match_id: 9000 + index,
    hero_id: 7,
    hero_level: 25,
    start_time: 1_799_999_900 + index,
    game_mode: 1,
    match_mode: 1,
    player_team: 0,
    player_kills: index === 5 ? 19 : 10,
    player_deaths: index === 4 ? 0 : 3,
    player_assists: index === 5 ? 14 : 5,
    denies: 10,
    net_worth: 50_000 + index * 1_000,
    last_hits: 300,
    match_duration_s: 2_000,
    match_result: 1,
    objectives_mask_team0: 15,
    objectives_mask_team1: 7,
    player_match_outcome: index >= 3 ? 1 : 2,
  }
}
