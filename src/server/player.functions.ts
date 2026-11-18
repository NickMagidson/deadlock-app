import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'

import { createPlayerService, createProductionDeadlockPort } from './player.service.server'
import { createRequestCache } from './request-cache.server'

const accountInputSchema = z.object({
  accountId: z.number().int().positive().max(4_294_967_295),
})

const searchInputSchema = z.object({
  query: z.string().trim().max(100),
})

const matchesInputSchema = accountInputSchema.extend({
  hero: z.number().int().positive().optional(),
  page: z.number().int().positive(),
  result: z.enum(['all', 'wins', 'losses']),
})

const matchDetailInputSchema = accountInputSchema.extend({
  matchId: z.string().regex(/^[1-9]\d*$/),
})

export const searchPlayers = createServerFn({ method: 'GET' })
  .validator(searchInputSchema)
  .handler(({ data }) => service().searchPlayers(data))

export const getPlayerSummary = createServerFn({ method: 'GET' })
  .validator(accountInputSchema)
  .handler(({ data }) => service().getPlayerSummary(data))

export const getPlayerHeroStats = createServerFn({ method: 'GET' })
  .validator(accountInputSchema)
  .handler(({ data }) => service().getPlayerHeroStats(data))

export const getPlayerMatches = createServerFn({ method: 'GET' })
  .validator(matchesInputSchema)
  .handler(({ data }) => service().getPlayerMatches(data))

export const getMatchDetail = createServerFn({ method: 'GET' })
  .validator(matchDetailInputSchema)
  .handler(({ data }) => service().getMatchDetail(data))

function service() {
  const request = getRequest()
  let cache = requestCaches.get(request)
  if (!cache) {
    cache = createRequestCache()
    requestCaches.set(request, cache)
  }
  return createPlayerService(createProductionDeadlockPort(), cache)
}

const requestCaches = new WeakMap<Request, ReturnType<typeof createRequestCache>>()
