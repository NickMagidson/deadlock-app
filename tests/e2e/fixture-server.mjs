import { createServer } from 'node:http'

const profiles = {
  Ivy: profile(123, 'Ivy'),
  '123': profile(123, 'Exact Account'),
  '4294967296': profile(456, '4294967296'),
}

createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1:3100')
  response.setHeader('Content-Type', 'application/json')

  if (url.pathname === '/health') return response.end('{"ok":true}')
  if (url.pathname === '/v1/players/steam-search') {
    const query = url.searchParams.get('search_query') ?? ''
    return response.end(JSON.stringify(profiles[query] ? [profiles[query]] : []))
  }
  if (url.pathname === '/v1/players/steam') {
    const accountId = url.searchParams.get('account_ids') ?? ''
    return response.end(JSON.stringify(profiles[accountId] ? [profiles[accountId]] : []))
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
