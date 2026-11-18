import type { z } from 'zod'

import { DeadlockApiError } from './errors'

interface DeadlockClientOptions {
  baseUrl: string
  apiKey?: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

interface DeadlockFetchOptions {
  signal?: AbortSignal
}

export function createDeadlockClient({
  baseUrl,
  apiKey,
  fetchImpl = fetch,
  timeoutMs = 8_000,
}: DeadlockClientOptions) {
  const base = new URL(baseUrl)

  return {
    async fetch<T>(
      path: string,
      schema: z.ZodType<T>,
      options: DeadlockFetchOptions = {},
    ): Promise<T> {
      const url = new URL(path, ensureTrailingSlash(base))
      if (url.origin !== base.origin) {
        throw new DeadlockApiError({
          code: 'unknown',
          message: 'The Deadlock request could not be created.',
        })
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)
      const abortFromCaller = () => controller.abort(options.signal?.reason)
      options.signal?.addEventListener('abort', abortFromCaller, { once: true })

      try {
        const headers = new Headers({ Accept: 'application/json' })
        if (apiKey) headers.set('X-API-Key', apiKey)

        const response = await fetchImpl(url, {
          headers,
          signal: controller.signal,
        })

        if (!response.ok) throw errorFromResponse(response)

        let payload: unknown
        try {
          payload = await response.json()
        } catch (cause) {
          throw invalidResponse(cause)
        }

        const parsed = schema.safeParse(payload)
        if (!parsed.success) throw invalidResponse(parsed.error)
        return parsed.data
      } catch (error) {
        if (error instanceof DeadlockApiError) throw error
        if (controller.signal.aborted) {
          throw new DeadlockApiError({
            code: 'timeout',
            message: 'Deadlock took too long to respond.',
            cause: error,
          })
        }
        throw new DeadlockApiError({
          code: 'unknown',
          message: 'Deadlock could not be reached.',
          cause: error,
        })
      } finally {
        clearTimeout(timeout)
        options.signal?.removeEventListener('abort', abortFromCaller)
      }
    },
  }
}

const productionClient = createDeadlockClient({
  baseUrl: process.env.DEADLOCK_API_BASE_URL ?? 'https://api.deadlock-api.com',
  apiKey: process.env.DEADLOCK_API_KEY,
})

export function deadlockFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  options?: DeadlockFetchOptions,
) {
  return productionClient.fetch(path, schema, options)
}

function errorFromResponse(response: Response) {
  const retryAfterSeconds = parseRetryAfter(response.headers.get('Retry-After'))

  if (response.status === 404) {
    return new DeadlockApiError({
      code: 'not-found',
      message: 'The requested Deadlock record was not found.',
      status: response.status,
    })
  }

  if (response.status === 429 || response.status === 503) {
    return new DeadlockApiError({
      code: 'rate-limited',
      message: 'Deadlock is busy. Please try again later.',
      status: response.status,
      retryAfterSeconds,
    })
  }

  if (response.status === 504 || response.status >= 500) {
    return new DeadlockApiError({
      code: 'unavailable',
      message: 'Deadlock is temporarily unavailable.',
      status: response.status,
      retryAfterSeconds,
    })
  }

  return new DeadlockApiError({
    code: 'unknown',
    message: 'Deadlock could not complete this request.',
    status: response.status,
    retryAfterSeconds,
  })
}

function invalidResponse(cause: unknown) {
  return new DeadlockApiError({
    code: 'invalid-response',
    message: 'Deadlock returned data in an unexpected format.',
    cause,
  })
}

function parseRetryAfter(value: string | null) {
  if (!value) return undefined
  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds)
  const at = Date.parse(value)
  if (Number.isNaN(at)) return undefined
  return Math.max(0, Math.ceil((at - Date.now()) / 1_000))
}

function ensureTrailingSlash(url: URL) {
  const value = new URL(url)
  if (!value.pathname.endsWith('/')) value.pathname += '/'
  return value
}
