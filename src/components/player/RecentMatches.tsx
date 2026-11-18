import type { ScoredMatch } from '../../domain/achievements'
import type { MatchPage } from '../../domain/match-window'

export function StandoutMatches({ accountId, standouts }: { accountId: number; standouts: ScoredMatch[] }) {
  if (!standouts.length) return null
  return (
    <section className="profile-section" aria-labelledby="standouts-heading">
      <div className="section-heading"><p className="eyebrow">Ranked highlights</p><h2 id="standouts-heading">Standout matches</h2></div>
      <ol className="match-ledger">
        {standouts.map(({ match, score }, index) => (
          <li key={match.matchId}>
            <strong>#{index + 1}</strong>
            <a href={`/players/${accountId}/matches/${match.matchId}`}>Match {match.matchId}</a>
            <strong>{match.kills} / {match.deaths} / {match.assists}</strong>
            <small>Impact {score.toFixed(1)}</small>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function RecentMatches({ accountId = 123, page }: { accountId?: number; page: MatchPage }) {
  return (
    <section className="profile-section" aria-labelledby="matches-heading">
      <div className="section-heading section-heading--split">
        <div>
          <p className="eyebrow">The latest ledger</p>
          <h2 id="matches-heading">Recent matches</h2>
        </div>
        <span>
          <span>Latest {page.sampleSize} available {page.sampleSize === 1 ? 'record' : 'records'}</span> ·{' '}
          <a href={`/players/${accountId}/matches?page=1&result=all`}>Explore all matches →</a>
        </span>
      </div>
      {page.items.length ? (
        <ol className="match-ledger">
          {page.items.slice(0, 8).map((match) => (
            <li key={match.matchId}>
              <span className={`result-mark result-mark--${match.outcome}`}>
                {match.outcome === 'win' ? 'W' : 'L'}
              </span>
              <span>
                <a href={`/players/${accountId}/matches/${match.matchId}`}><strong>Match {match.matchId}</strong></a>
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
