import { Link } from '@tanstack/react-router'

import type { MatchPage } from '../../domain/match-window'
import type { MatchFilters } from '../../features/matches/match-filters.schema'
import { EmptyState } from '../system/EmptyState'

interface MatchTableProps {
  accountId: number
  filters: MatchFilters
  page: MatchPage
}

export function MatchTable({ accountId, filters, page }: MatchTableProps) {
  return (
    <section className="match-table-wrap" aria-label="Match history">
      <p className="sample-disclosure">
        Showing matches from the latest 100 available records.
      </p>
      {page.items.length ? (
        <table className="match-table">
          <thead>
            <tr>
              <th scope="col">Result</th>
              <th scope="col">Match</th>
              <th scope="col">Hero</th>
              <th scope="col">K / D / A</th>
              <th scope="col">Duration</th>
            </tr>
          </thead>
          <tbody>
            {page.items.map((match) => (
              <tr key={match.matchId}>
                <td><span className={`result-chip result-chip--${match.outcome}`}>{match.outcome}</span></td>
                <td>
                  <Link
                    aria-label={`Open match ${match.matchId}`}
                    params={{ accountId: String(accountId), matchId: match.matchId }}
                    preload={false}
                    search={{}}
                    to="/players/$accountId/matches/$matchId"
                  >
                    {match.matchId}
                  </Link>
                </td>
                <td>Hero {match.heroId}</td>
                <td>{match.kills} / {match.deaths} / {match.assists}</td>
                <td>{Math.round(match.durationSeconds / 60)} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState
          description="Try a broader hero or result filter."
          title="No matches in the latest available sample match these filters."
        />
      )}
      <nav className="pagination" aria-label="Match pages">
        {page.hasPrevious ? (
          <Link aria-label="Previous page" params={{ accountId: String(accountId) }} search={pageSearch(filters, filters.page - 1)} to="/players/$accountId/matches">
            ← Previous
          </Link>
        ) : <span />}
        <span>Page {page.page}</span>
        {page.hasNext ? (
          <Link aria-label="Next page" params={{ accountId: String(accountId) }} search={pageSearch(filters, filters.page + 1)} to="/players/$accountId/matches">
            Next →
          </Link>
        ) : <span />}
      </nav>
    </section>
  )
}

function pageSearch(filters: MatchFilters, page: number): MatchFilters {
  return {
    ...('hero' in filters && filters.hero !== undefined ? { hero: filters.hero } : {}),
    page,
    result: filters.result,
  }
}
