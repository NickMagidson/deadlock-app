import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PlayerSearchResult } from '../../lib/deadlock/models'
import { usePlayerSuggestions } from './usePlayerSuggestions'

describe('usePlayerSuggestions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('waits for the debounce before requesting suggestions', async () => {
    const fetchSuggestions = vi.fn(async () => [player('Ivy')])
    const { result } = renderHook(() => usePlayerSuggestions('Ivy', fetchSuggestions))

    expect(result.current).toEqual({ suggestions: [], status: 'loading' })
    await act(() => vi.advanceTimersByTimeAsync(249))
    expect(fetchSuggestions).not.toHaveBeenCalled()

    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(fetchSuggestions).toHaveBeenCalledWith('Ivy')
    expect(result.current).toEqual({ suggestions: [player('Ivy')], status: 'ready' })
  })

  it('publishes ready and empty results', async () => {
    const fetchSuggestions = vi
      .fn<(query: string) => Promise<PlayerSearchResult[]>>()
      .mockResolvedValueOnce([player('Ivy')])
      .mockResolvedValueOnce([])
    const { result, rerender } = renderHook(
      ({ query }) => usePlayerSuggestions(query, fetchSuggestions),
      { initialProps: { query: 'Iv' } },
    )

    await act(() => vi.advanceTimersByTimeAsync(250))
    expect(result.current).toEqual({ suggestions: [player('Ivy')], status: 'ready' })

    rerender({ query: 'Nobody' })
    expect(result.current).toEqual({ suggestions: [], status: 'loading' })
    await act(() => vi.advanceTimersByTimeAsync(250))
    expect(result.current).toEqual({ suggestions: [], status: 'empty' })
  })

  it('reports suggestion failures without throwing', async () => {
    const fetchSuggestions = vi.fn(async () => {
      throw new Error('offline')
    })
    const { result } = renderHook(() => usePlayerSuggestions('Ivy', fetchSuggestions))

    await act(() => vi.advanceTimersByTimeAsync(250))

    expect(result.current).toEqual({ suggestions: [], status: 'error' })
  })

  it('ignores an older response that resolves after the current query', async () => {
    const requests = new Map<string, (players: PlayerSearchResult[]) => void>()
    const fetchSuggestions = (query: string) =>
      new Promise<PlayerSearchResult[]>((resolve) => requests.set(query, resolve))
    const { result, rerender } = renderHook(
      ({ query }) => usePlayerSuggestions(query, fetchSuggestions),
      { initialProps: { query: 'Iv' } },
    )

    await act(() => vi.advanceTimersByTimeAsync(250))
    rerender({ query: 'Ivy' })
    await act(() => vi.advanceTimersByTimeAsync(250))
    await act(async () => requests.get('Ivy')?.([player('Ivy')]))
    expect(result.current.suggestions).toEqual([player('Ivy')])

    await act(async () => requests.get('Iv')?.([player('Old result')]))
    expect(result.current.suggestions).toEqual([player('Ivy')])
  })

  it('ignores a pending response after the query is cleared', async () => {
    let resolveRequest: ((players: PlayerSearchResult[]) => void) | undefined
    const fetchSuggestions = () =>
      new Promise<PlayerSearchResult[]>((resolve) => {
        resolveRequest = resolve
      })
    const { result, rerender } = renderHook(
      ({ query }) => usePlayerSuggestions(query, fetchSuggestions),
      { initialProps: { query: 'Ivy' } },
    )

    await act(() => vi.advanceTimersByTimeAsync(250))
    rerender({ query: '' })
    expect(result.current).toEqual({ suggestions: [], status: 'idle' })

    await act(async () => resolveRequest?.([player('Ivy')]))
    expect(result.current).toEqual({ suggestions: [], status: 'idle' })
  })
})

function player(displayName: string): PlayerSearchResult {
  return {
    accountId: 123,
    displayName,
    avatarUrl: 'https://cdn.example.com/avatar.jpg',
    profileUrl: 'https://steamcommunity.com/profiles/123',
  }
}
