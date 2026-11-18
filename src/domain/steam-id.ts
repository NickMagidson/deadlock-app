const STEAM_ID64_OFFSET = 76561197960265728n
const MAX_ACCOUNT_ID = 4_294_967_295n

export type SteamQuery =
  | {
      kind: 'account-id'
      accountId: number
      original: string
    }
  | {
      kind: 'name'
      query: string
    }

export function classifySteamQuery(query: string): SteamQuery {
  const normalized = query.trim()
  const steamId3Match = /^\[U:1:(\d+)]$/.exec(normalized)

  if (steamId3Match) {
    const accountId = BigInt(steamId3Match[1])
    if (isAccountId(accountId)) {
      return accountQuery(normalized, accountId)
    }
  }

  if (/^\d{17}$/.test(normalized)) {
    const accountId = BigInt(normalized) - STEAM_ID64_OFFSET
    if (isAccountId(accountId)) {
      return accountQuery(normalized, accountId)
    }
  }

  if (/^\d{1,10}$/.test(normalized)) {
    const accountId = BigInt(normalized)
    if (isAccountId(accountId)) {
      return accountQuery(normalized, accountId)
    }
  }

  return { kind: 'name', query: normalized }
}

function isAccountId(value: bigint) {
  return value > 0n && value <= MAX_ACCOUNT_ID
}

function accountQuery(original: string, value: bigint): SteamQuery {
  return {
    kind: 'account-id',
    accountId: Number(value),
    original,
  }
}
