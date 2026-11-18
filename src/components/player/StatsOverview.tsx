import type { PlayerStats, RecentForm } from '../../domain/player-analytics'

interface StatsOverviewProps {
  stats: PlayerStats
  recentForm: RecentForm | null
}

export function StatsOverview({ stats, recentForm }: StatsOverviewProps) {
  return (
    <section className="profile-section" aria-labelledby="overview-heading">
      <div className="section-heading">
        <p className="eyebrow">The available record</p>
        <h2 id="overview-heading">Performance at a glance</h2>
      </div>
      <div className="stat-band">
        <Stat label="Win rate" value={percent(stats.winRate)} />
        <Stat label="Available matches" value={String(stats.recordedMatches)} />
        <Stat label="KDA" value={decimal(stats.kda)} />
        <Stat
          label="Recent record"
          value={recentForm ? `${recentForm.wins}–${recentForm.losses}` : 'Not enough data'}
        />
      </div>
      <p className="sample-note">{stats.recordedMatches} available matches</p>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function percent(value: number | null) {
  return value === null ? 'Not enough data' : `${(value * 100).toFixed(1)}%`
}

function decimal(value: number | null) {
  return value === null ? 'Not enough data' : value.toFixed(2)
}
