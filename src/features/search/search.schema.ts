import { z } from 'zod'

export const searchSchema = z.object({
  q: z.preprocess(
    (value) => (typeof value === 'number' ? String(value) : value),
    z.string().trim().max(100),
  ).catch(''),
})

export type SearchState = z.infer<typeof searchSchema>
