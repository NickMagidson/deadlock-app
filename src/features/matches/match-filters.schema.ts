import { z } from 'zod'

const rawMatchFiltersSchema = z.object({
  hero: z.coerce.number().int().positive().optional().catch(undefined),
  page: z.coerce.number().int().positive().catch(1),
  result: z.enum(['all', 'wins', 'losses']).catch('all'),
})

export const matchFiltersSchema = rawMatchFiltersSchema.transform(
  ({ hero, ...filters }) => (hero === undefined ? filters : { ...filters, hero }),
)

export type MatchFilters = z.infer<typeof matchFiltersSchema>
