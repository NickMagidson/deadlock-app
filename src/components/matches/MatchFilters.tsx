import { useEffect, useState } from 'react'

import type { MatchFilters as MatchFilterState } from '../../features/matches/match-filters.schema'

interface MatchFiltersProps {
  filters: MatchFilterState
  heroes: Array<{ id: number; name: string }>
  onChange: (filters: MatchFilterState) => void
}

export function MatchFilters({ filters, heroes, onChange }: MatchFiltersProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return (
    <div className="match-filters">
      <label>
        Hero
        <select
          disabled={!isHydrated}
          onChange={(event) => {
            const hero = event.target.value ? Number(event.target.value) : undefined
            onChange(
              hero === undefined
                ? { page: 1, result: filters.result }
                : { hero, page: 1, result: filters.result },
            )
          }}
          value={'hero' in filters ? (filters.hero ?? '') : ''}
        >
          <option value="">All heroes</option>
          {heroes.map((hero) => (
            <option key={hero.id} value={hero.id}>
              {hero.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Result
        <select
          disabled={!isHydrated}
          onChange={(event) =>
            onChange({
              ...('hero' in filters && filters.hero !== undefined
                ? { hero: filters.hero }
                : {}),
              page: 1,
              result: event.target.value as MatchFilterState['result'],
            })
          }
          value={filters.result}
        >
          <option value="all">All results</option>
          <option value="wins">Wins</option>
          <option value="losses">Losses</option>
        </select>
      </label>
    </div>
  )
}
