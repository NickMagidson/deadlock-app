import { describe, expect, it } from 'vitest'

import { searchSchema } from './search.schema'

describe('searchSchema', () => {
  it('defaults a missing query to an empty string', () => {
    expect(searchSchema.parse({})).toEqual({ q: '' })
  })

  it('trims a valid query', () => {
    expect(searchSchema.parse({ q: '  Ivy  ' })).toEqual({ q: 'Ivy' })
  })

  it('preserves numeric-looking search text parsed by the router', () => {
    expect(searchSchema.parse({ q: 4_294_967_296 })).toEqual({ q: '4294967296' })
  })

  it('catches a query longer than 100 characters', () => {
    expect(searchSchema.parse({ q: 'x'.repeat(101) })).toEqual({ q: '' })
  })
})
