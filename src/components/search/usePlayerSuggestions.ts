import { useEffect, useState } from 'react'

import type { PlayerSearchResult } from '../../lib/deadlock/models'

export type PlayerSuggestionStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

interface PlayerSuggestionState {
  suggestions: PlayerSearchResult[]
  status: PlayerSuggestionStatus
}

export function usePlayerSuggestions(
  query: string,
  fetchSuggestions: (query: string) => Promise<PlayerSearchResult[]>,
  debounceMs = 250,
): PlayerSuggestionState {
  const normalizedQuery = query.trim()
  const [state, setState] = useState<PlayerSuggestionState>(() => ({
    suggestions: [],
    status: normalizedQuery ? 'loading' : 'idle',
  }))

  useEffect(() => {
    if (!normalizedQuery) {
      setState({ suggestions: [], status: 'idle' })
      return
    }

    setState({ suggestions: [], status: 'loading' })
    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        const suggestions = await fetchSuggestions(normalizedQuery)
        if (cancelled) return
        setState({
          suggestions,
          status: suggestions.length > 0 ? 'ready' : 'empty',
        })
      } catch {
        if (cancelled) return
        setState({ suggestions: [], status: 'error' })
      }
    }, debounceMs)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [debounceMs, fetchSuggestions, normalizedQuery])

  return state
}
