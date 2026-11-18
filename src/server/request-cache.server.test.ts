// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { createRequestCache } from './request-cache.server'

describe('request-scoped cache', () => {
  it('deduplicates equal endpoint and input pairs only within one cache', async () => {
    const cache = createRequestCache()
    let calls = 0
    const load = async () => {
      calls += 1
      return { value: 42 }
    }

    const [first, second] = await Promise.all([
      cache.getOrCreate('profile', { accountId: 123 }, load),
      cache.getOrCreate('profile', { accountId: 123 }, load),
    ])
    await cache.getOrCreate('profile', { accountId: 456 }, load)

    expect(first).toEqual({ value: 42 })
    expect(second).toBe(first)
    expect(calls).toBe(2)
  })

  it('does not share values between request cache instances', async () => {
    let calls = 0
    const load = async () => ++calls

    await createRequestCache().getOrCreate('rank', 123, load)
    await createRequestCache().getOrCreate('rank', 123, load)

    expect(calls).toBe(2)
  })

  it('evicts rejected work so an explicit retry can load again', async () => {
    const cache = createRequestCache()
    let calls = 0
    const load = async () => {
      calls += 1
      if (calls === 1) throw new Error('temporary')
      return 'ready'
    }

    await expect(cache.getOrCreate('matches', 123, load)).rejects.toThrow('temporary')
    await expect(cache.getOrCreate('matches', 123, load)).resolves.toBe('ready')
    expect(calls).toBe(2)
  })
})
