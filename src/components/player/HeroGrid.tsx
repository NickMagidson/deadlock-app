import type { HeroPerformanceSource } from '../../lib/deadlock/models'

export interface EnrichedHero extends HeroPerformanceSource {
  name: string
  imageUrl: string | null
}

export function HeroGrid({ heroes }: { heroes: EnrichedHero[] }) {
  return (
    <section className="profile-section" aria-labelledby="heroes-heading">
      <div className="section-heading">
        <p className="eyebrow">Signature cast</p>
        <h2 id="heroes-heading">Most-played heroes</h2>
      </div>
      {heroes.length ? (
        <div className="hero-grid">
          {heroes.slice(0, 6).map((hero) => (
            <article key={hero.heroId}>
              {hero.imageUrl ? <img alt="" src={hero.imageUrl} /> : <span aria-hidden="true">{hero.name.slice(0, 1)}</span>}
              <div>
                <h3>{hero.name}</h3>
                <p>{hero.matchesPlayed} matches · {formatWinRate(hero.wins, hero.matchesPlayed)} WR</p>
                <small>{formatKda(hero)} average KDA</small>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-copy">No hero statistics are available for this player.</p>
      )}
    </section>
  )
}

function formatWinRate(wins: number, matches: number) {
  return matches === 0 ? '—' : `${((wins / matches) * 100).toFixed(0)}%`
}

function formatKda(hero: HeroPerformanceSource) {
  if (hero.matchesPlayed === 0) return '—'
  return `${(hero.kills / hero.matchesPlayed).toFixed(1)} / ${(hero.deaths / hero.matchesPlayed).toFixed(1)} / ${(hero.assists / hero.matchesPlayed).toFixed(1)}`
}
