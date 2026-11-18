import { Link } from '@tanstack/react-router'

import type { PlayerSearchResult } from '../../lib/deadlock/models'
import { AppError } from '../system/AppError'
import { EmptyState } from '../system/EmptyState'

interface SearchResultsProps {
  query: string
  results: PlayerSearchResult[]
  error?: unknown
  onRetry?: () => void | Promise<void>
}

export function SearchResults({ query, results, error, onRetry }: SearchResultsProps) {
  if (error) {
    return (
      <section className="search-results search-results--message" aria-label="Search results">
        <AppError error={error} onRetry={onRetry} />
      </section>
    )
  }

  if (!query) {
    return (
      <section className="search-results search-results--message" aria-label="Search results">
        <p>Search by Steam name or ID to begin.</p>
      </section>
    )
  }

  if (results.length === 0) {
    return (
      <section className="search-results search-results--message" aria-label="Search results">
        <EmptyState
          description="Check the spelling or try a Steam account ID."
          title={`No players found for “${query}”.`}
        />
      </section>
    )
  }

  return (
    <section className="search-results" aria-label="Search results">
      <p className="search-results__count" role="status">
        {results.length} {results.length === 1 ? 'player' : 'players'} found
      </p>
      <ul>
        {results.map((player) => (
          <li key={player.accountId}>
            <Link
              params={{ accountId: String(player.accountId) }}
              to="/players/$accountId"
            >
              <span className="sr-only">View</span>{' '}
              {player.avatarUrl ? (
                <img alt="" height={64} src={player.avatarUrl} width={64} />
              ) : (
                <span aria-hidden="true" className="search-result__initials">
                  {initials(player.displayName)}
                </span>
              )}
              <span>
                <strong>{player.displayName}</strong>
                {' '}
                <small>Account {player.accountId}</small>
              </span>
              <span aria-hidden="true" className="search-result__arrow">
                ↗
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || '??'
}
