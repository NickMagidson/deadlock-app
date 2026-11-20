import { useId, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react'

import type { PlayerSearchResult } from '../../lib/deadlock/models'
import { usePlayerSuggestions } from './usePlayerSuggestions'

interface PlayerSearchFormProps {
  getSuggestions: (query: string) => Promise<PlayerSearchResult[]>
  initialQuery: string
  onSubmit: (query: string) => void
}

export function PlayerSearchForm({ getSuggestions, initialQuery, onSubmit }: PlayerSearchFormProps) {
  const [query, setQuery] = useState(initialQuery)
  const [suggestionQuery, setSuggestionQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isComposing, setIsComposing] = useState(false)
  const pointerSelecting = useRef(false)
  const listboxId = useId()
  const { suggestions, status } = usePlayerSuggestions(suggestionQuery, getSuggestions)
  const hasOptions = isOpen && status === 'ready' && suggestions.length > 0
  const activeOptionId = activeIndex === null
    ? undefined
    : `${listboxId}-${suggestions[activeIndex]?.accountId}`

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isComposing) return
    onSubmit(query.trim())
  }

  function changeQuery(event: ChangeEvent<HTMLInputElement>) {
    const nextQuery = event.currentTarget.value
    setQuery(nextQuery)
    setSuggestionQuery(nextQuery)
    setIsOpen(Boolean(nextQuery.trim()))
    setActiveIndex(null)
  }

  function selectSuggestion(player: PlayerSearchResult) {
    setQuery(player.displayName)
    setSuggestionQuery('')
    setIsOpen(false)
    setActiveIndex(null)
    pointerSelecting.current = false
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (isComposing || event.nativeEvent.isComposing) return

    if (event.key === 'Escape') {
      event.preventDefault()
      setIsOpen(false)
      setActiveIndex(null)
      return
    }

    if (!hasOptions) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => current === null ? 0 : (current + 1) % suggestions.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => current === null
        ? suggestions.length - 1
        : (current - 1 + suggestions.length) % suggestions.length)
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(0)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      setActiveIndex(suggestions.length - 1)
      return
    }

    if (event.key === 'Enter' && activeIndex !== null) {
      event.preventDefault()
      selectSuggestion(suggestions[activeIndex])
    }
  }

  return (
    <form action="/" className="player-search" method="get" role="search" onSubmit={submit}>
      <label className="sr-only" htmlFor="player-query">Steam name or ID</label>
      <div className="player-search__combobox">
        <div className="player-search__control">
          <input
            aria-activedescendant={activeOptionId}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={hasOptions}
            id="player-query"
            maxLength={100}
            name="q"
            placeholder="ExamplePlayer or 7656119…"
            role="combobox"
            type="search"
            value={query}
            onBlur={() => {
              if (pointerSelecting.current) return
              setIsOpen(false)
              setActiveIndex(null)
            }}
            onChange={changeQuery}
            onCompositionEnd={() => setIsComposing(false)}
            onCompositionStart={() => setIsComposing(true)}
            onKeyDown={handleKeyDown}
          />
          <button aria-label="Search" type="submit">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="6" />
              <path d="m16 16 4 4" />
            </svg>
          </button>
        </div>
        {hasOptions ? (
          <ul aria-label="Player suggestions" className="player-suggestions" id={listboxId} role="listbox">
            {suggestions.map((player, index) => (
              <li
                id={`${listboxId}-${player.accountId}`}
                key={player.accountId}
                role="option"
                aria-selected={activeIndex === index}
                onClick={() => selectSuggestion(player)}
                onPointerDown={() => {
                  pointerSelecting.current = true
                }}
              >
                {player.avatarUrl ? (
                  <img alt="" height={40} src={player.avatarUrl} width={40} />
                ) : (
                  <span aria-hidden="true" className="player-suggestions__initials">
                    {initials(player.displayName)}
                  </span>
                )}
                <strong>{player.displayName}</strong>
              </li>
            ))}
          </ul>
        ) : null}
        {isOpen && status !== 'ready' && status !== 'idle' ? (
          <div className="player-suggestions player-suggestions--status" role="status">
            {suggestionStatus(status)}
          </div>
        ) : null}
      </div>
      <p>Steam display name, SteamID3, or SteamID64</p>
    </form>
  )
}

function suggestionStatus(status: 'loading' | 'empty' | 'error') {
  if (status === 'loading') return 'Searching players…'
  if (status === 'empty') return 'No player suggestions.'
  return 'Suggestions unavailable. You can still search.'
}

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || '??'
}
