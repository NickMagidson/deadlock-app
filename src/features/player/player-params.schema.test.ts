import { describe, expect, it } from 'vitest'

import { accountIdSchema, matchIdSchema } from './player-params.schema'

describe('accountIdSchema', () => {
  it.each([
    ['1', 1],
    ['4294967295', 4294967295],
  ])('parses %s as a positive uint32', (input, expected) => {
    expect(accountIdSchema.parse(input)).toBe(expected)
  })

  it.each(['0', '-1', '4294967296', '12.5', 'player'])('rejects %s', (input) => {
    expect(accountIdSchema.safeParse(input).success).toBe(false)
  })
})

describe('matchIdSchema', () => {
  it('keeps a positive 64-bit ID as a precision-safe string', () => {
    expect(matchIdSchema.parse('9223372036854775807')).toBe('9223372036854775807')
  })

  it('normalizes leading zeroes without converting to Number', () => {
    expect(matchIdSchema.parse('00042')).toBe('42')
  })

  it.each(['0', '-1', '9223372036854775808', '1.5', 'match'])('rejects %s', (input) => {
    expect(matchIdSchema.safeParse(input).success).toBe(false)
  })
})
