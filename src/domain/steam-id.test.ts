import { describe, expect, it } from 'vitest'

import { classifySteamQuery } from './steam-id'

describe('classifySteamQuery', () => {
  it.each([
    ['[U:1:123]', 123],
    ['  [U:1:123]  ', 123],
    ['123', 123],
    ['76561197960265851', 123],
  ])('recognizes %s as account ID %i', (query, accountId) => {
    expect(classifySteamQuery(query)).toEqual({
      kind: 'account-id',
      accountId,
      original: query.trim(),
    })
  })

  it.each([
    ['4294967296', '4294967296'],
    ['[U:1:4294967296]', '[U:1:4294967296]'],
    ['[U:1:not-a-number]', '[U:1:not-a-number]'],
    ['12345678901', '12345678901'],
    ['  Player Name  ', 'Player Name'],
    ['', ''],
  ])('keeps %s as a display-name query', (query, normalized) => {
    expect(classifySteamQuery(query)).toEqual({
      kind: 'name',
      query: normalized,
    })
  })
})
