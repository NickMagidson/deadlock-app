import type { MatchDetailResult } from '../../server/player.service.server'

export function MatchScoreboard({ detail }: { detail: MatchDetailResult }) {
  return (
    <section className="scoreboard" aria-labelledby="scoreboard-heading">
      <p className="eyebrow">Player-focused scoreboard</p>
      <h1 id="scoreboard-heading">Match {detail.matchId}</h1>
      <table>
        <thead>
          <tr>
            <th scope="col">Player</th>
            <th scope="col">Hero</th>
            <th scope="col">Kills</th>
            <th scope="col">Deaths</th>
            <th scope="col">Assists</th>
          </tr>
        </thead>
        <tbody>
          {detail.participants.map((participant) => (
            <tr
              aria-current={participant.accountId === detail.player.accountId ? 'true' : undefined}
              key={participant.accountId}
            >
              <th scope="row">Account {participant.accountId}</th>
              <td>Hero {participant.heroId}</td>
              <td>{participant.kills}</td>
              <td>{participant.deaths}</td>
              <td>{participant.assists}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
