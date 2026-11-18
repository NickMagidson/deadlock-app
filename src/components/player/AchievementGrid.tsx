import type { PlayerAchievement } from '../../domain/achievements'

export function AchievementGrid({ accountId, achievements }: { accountId?: number; achievements: PlayerAchievement[] }) {
  return (
    <section className="profile-section" aria-labelledby="achievements-heading">
      <div className="section-heading">
        <p className="eyebrow">Highlights</p>
        <h2 id="achievements-heading">Notable achievements</h2>
      </div>
      {achievements.length ? (
        <div className="achievement-grid">
          {achievements.map((achievement) => (
            <article key={`${achievement.kind}-${achievement.matchId ?? achievement.heroId ?? ''}`}>
              <span aria-hidden="true">✦</span>
              <h3>{achievement.title}</h3>
              <p>{achievement.description}</p>
              <small>{achievement.evidence}</small>
              {accountId && achievement.matchId ? (
                <a href={`/players/${accountId}/matches/${achievement.matchId}`}>Open match →</a>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-copy">More available matches are needed before achievements can be named.</p>
      )}
    </section>
  )
}
