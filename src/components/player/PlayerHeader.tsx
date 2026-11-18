import type { PlayerSummaryResult } from '../../server/player.service.server'

export function PlayerHeader({ summary }: { summary: PlayerSummaryResult }) {
  const { identity, rank } = summary
  const rankLabel = rank.tier === 0 ? 'Unranked' : `${rank.name ?? 'Unknown rank'} ${roman(rank.subrank)}`

  return (
    <header className="profile-header">
      <div className="profile-header__identity">
        {identity.avatarUrl ? (
          <img alt="" height={112} src={identity.avatarUrl} width={112} />
        ) : (
          <span aria-hidden="true" className="profile-header__avatar-fallback">
            {identity.displayName.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div>
          <p className="eyebrow">Player archive · Account {identity.accountId}</p>
          <h1>{identity.displayName}</h1>
          <p>{identity.matchesPlayedLast30Days} matches recorded in the last 30 days</p>
        </div>
      </div>
      <div className="profile-header__rank" style={{ '--rank-color': rank.color ?? '#8f8260' } as React.CSSProperties}>
        {rank.imageUrl ? <img alt="" height={72} src={rank.imageUrl} width={72} /> : null}
        <span>
          <small>Current rank</small>
          <strong>{rankLabel.trim()}</strong>
        </span>
      </div>
    </header>
  )
}

function roman(value: number) {
  return ['', 'I', 'II', 'III', 'IV', 'V', 'VI'][value] ?? String(value)
}
