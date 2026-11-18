import { z } from 'zod'

const MAX_ACCOUNT_ID = 4_294_967_295
const MAX_MATCH_ID = 9_223_372_036_854_775_807n

export const accountIdSchema = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(MAX_ACCOUNT_ID))

export const matchIdSchema = z
  .string()
  .regex(/^\d+$/)
  .transform(BigInt)
  .pipe(z.bigint().min(1n).max(MAX_MATCH_ID))
  .transform(String)
