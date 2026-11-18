// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { createDeadlockClient } from './client.server'

const responseSchema = z.object({ value: z.number() })

describe('Deadlock server client', () => {
  it('validates JSON and sends the optional API key once', async () => {
    const fetchImpl = vi.fn(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        Response.json({ value: 42, future_field: true }),
    )
    const client = createDeadlockClient({
      apiKey: 'test-key',
      baseUrl: 'https://api.deadlock-api.com',
      fetchImpl,
      timeoutMs: 100,
    })

    await expect(client.fetch('/v1/example', responseSchema)).resolves.toEqual({
      value: 42,
    })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(fetchImpl.mock.calls[0]?.[0].toString()).toBe(
      'https://api.deadlock-api.com/v1/example',
    )
    expect(new Headers(fetchImpl.mock.calls[0]?.[1]?.headers).get('X-API-Key')).toBe(
      'test-key',
    )
  })

  it('rejects valid JSON that violates the upstream schema', async () => {
    const client = createDeadlockClient({
      baseUrl: 'https://api.deadlock-api.com',
      fetchImpl: vi.fn(async () => Response.json({ value: 'forty-two' })),
      timeoutMs: 100,
    })

    await expect(client.fetch('/v1/example', responseSchema)).rejects.toMatchObject({
      code: 'invalid-response',
      message: 'Deadlock returned data in an unexpected format.',
    })
  })

  it('maps malformed JSON without exposing the response body', async () => {
    const client = createDeadlockClient({
      baseUrl: 'https://api.deadlock-api.com',
      fetchImpl: vi.fn(async () =>
        new Response('private upstream body', {
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
      timeoutMs: 100,
    })

    await expect(client.fetch('/v1/example', responseSchema)).rejects.toMatchObject({
      code: 'invalid-response',
      message: 'Deadlock returned data in an unexpected format.',
    })
  })

  it.each([
    [404, 'not-found', undefined],
    [429, 'rate-limited', 12],
    [503, 'rate-limited', 12],
    [504, 'unavailable', 12],
  ] as const)(
    'maps status %i without retrying',
    async (status, code, retryAfterSeconds) => {
      const fetchImpl = vi.fn(async () =>
        new Response('do not expose me', {
          status,
          headers: { 'Retry-After': '12' },
        }),
      )
      const client = createDeadlockClient({
        baseUrl: 'https://api.deadlock-api.com',
        fetchImpl,
        timeoutMs: 100,
      })

      await expect(client.fetch('/v1/example', responseSchema)).rejects.toMatchObject({
        code,
        retryAfterSeconds,
      })
      expect(fetchImpl).toHaveBeenCalledTimes(1)
    },
  )

  it('maps an expired request to a timeout error', async () => {
    const fetchImpl = vi.fn(
      (_input: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        }),
    )
    const client = createDeadlockClient({
      baseUrl: 'https://api.deadlock-api.com',
      fetchImpl,
      timeoutMs: 5,
    })

    await expect(client.fetch('/v1/example', responseSchema)).rejects.toMatchObject({
      code: 'timeout',
      message: 'Deadlock took too long to respond.',
    })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})
