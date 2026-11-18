import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router'

import { MatchFilters } from '../components/matches/MatchFilters'
import { MatchTable } from '../components/matches/MatchTable'
import { matchFiltersSchema } from '../features/matches/match-filters.schema'
import { accountIdSchema } from '../features/player/player-params.schema'
import { getPlayerHeroStats, getPlayerMatches } from '../server/player.functions'

export const Route = createFileRoute('/players/$accountId_/matches')({
  ssr: true,
  validateSearch: matchFiltersSchema,
  loaderDeps: ({ search }) => ({
    hero: 'hero' in search ? search.hero : undefined,
    page: search.page,
    result: search.result,
  }),
  loader: async ({ params, deps }) => {
    const parsed = accountIdSchema.safeParse(params.accountId)
    if (!parsed.success) throw notFound()
    const accountId = parsed.data
    const filters = {
      ...(deps.hero === undefined ? {} : { hero: deps.hero }),
      page: deps.page,
      result: deps.result,
    }
    const [page, heroes] = await Promise.all([
      getPlayerMatches({ data: { accountId, ...filters } }),
      getPlayerHeroStats({ data: { accountId } }),
    ])
    return { accountId, filters, page, heroes }
  },
  head: ({ params }) => ({
    meta: [
      { title: `Player ${params.accountId} matches — Deadlock Ledger` },
      { name: 'description', content: 'Filter and explore a player’s latest available Deadlock matches.' },
    ],
  }),
  component: MatchExplorer,
})

function MatchExplorer() {
  const { accountId, filters, page, heroes } = Route.useLoaderData()
  const navigate = useNavigate({ from: '/players/$accountId/matches' })
  return (
    <main className="matches-page" id="main-content">
      <header className="matches-page__header">
        <div>
          <p className="eyebrow">Account {accountId}</p>
          <h1>Match explorer</h1>
          <p>Filter the latest available normal, ranked, and unranked records.</p>
        </div>
        <a href={`/players/${accountId}`}>← Player profile</a>
      </header>
      <MatchFilters
        filters={filters}
        heroes={heroes.map((hero) => ({ id: hero.heroId, name: hero.name }))}
        onChange={(search) => navigate({ search })}
      />
      <MatchTable accountId={accountId} filters={filters} page={page} />
    </main>
  )
}
