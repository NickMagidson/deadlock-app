import { describe, expect, it } from 'vitest'

import { matchFiltersSchema } from './match-filters.schema'

describe('matchFiltersSchema', () => {
  it('provides stable defaults', () => {
    expect(matchFiltersSchema.parse({})).toEqual({
      page: 1,
      result: 'all',
    })
  })

  it('coerces valid URL values', () => {
    expect(
      matchFiltersSchema.parse({ hero: '7', page: '3', result: 'wins' }),
    ).toEqual({ hero: 7, page: 3, result: 'wins' })
  })

  it.each([
    [{ hero: '0' }, { page: 1, result: 'all' }],
    [{ hero: '-4' }, { page: 1, result: 'all' }],
    [{ hero: 'abc' }, { page: 1, result: 'all' }],
    [{ page: '0' }, { page: 1, result: 'all' }],
    [{ result: 'draws' }, { page: 1, result: 'all' }],
  ])('catches invalid filters in %o', (input, expected) => {
    expect(matchFiltersSchema.parse(input)).toEqual(expected)
  })
})
