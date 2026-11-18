import type { MatchPage } from '../../domain/match-window'

export function RecentMatches({ page }: { page: MatchPage }) {
  return (
    <section className="profile-section" aria-labelledby="matches-heading">
      <div className="section-heading section-heading--split">
        <div>
          <p className="eyebrow">The latest ledger</p>
          <h2 id="matches-heading">Standout and recent matches</h2>
        </div>
        <span>Latest {page.sampleSize} available {page.sampleSize === 1 ? 'record' : 'records'}</span>
      </div>
      {page.items.length ? (
        <ol className="match-ledger">
          {page.items.slice(0, 8).map((match) => (
            <li key={match.matchId}>
              <span className={`result-mark result-mark--${match.outcome}`}>
                {match.outcome === 'win' ? 'W' : 'L'}
              </span>
              <span>
                <strong>Match {match.matchId}</strong>
                <small>{new Date(match.startTime * 1_000).toLocaleDateString('en-US')}</small>
              </span>
              <strong>{match.kills} / {match.deaths} / {match.assists}</strong>
              <small>{Math.round(match.durationSeconds / 60)} min</small>
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty-copy">No recent scored matches are available.</p>
      )}
    </section>
  )
}
