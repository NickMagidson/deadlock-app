import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'

import { PlayerSearchForm } from '../components/search/PlayerSearchForm'
import { SearchResults } from '../components/search/SearchResults'
import { toPublicErrorState } from '../components/system/AppError'
import { searchSchema } from '../features/search/search.schema'
import { searchPlayers } from '../server/player.functions'

export const Route = createFileRoute('/')({
  ssr: true,
  validateSearch: searchSchema,
  loaderDeps: ({ search: { q } }) => ({ q }),
  loader: async ({ deps: { q } }) => {
    if (!q) return { results: [], error: null }
    try {
      const results = await searchPlayers({ data: { query: q } })
      return { results, error: null }
    } catch (error) {
      return { results: [], error: publicSearchError(error) }
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.results.length
          ? `Deadlock players — ${loaderData.results.length} found`
          : 'Deadlock Player Explorer',
      },
      {
        name: 'description',
        content: 'Search for a Steam player and open their Deadlock performance archive.',
      },
    ],
  }),
  component: HomePage,
})

function HomePage() {
  const { q } = Route.useSearch()
  const { results, error } = Route.useLoaderData()
  const navigate = useNavigate({ from: '/' })
  const router = useRouter()

  return (
    <main className={q ? 'landing landing--searched' : 'landing'} id="main-content">
      <header className="landing__masthead">
        <LinkMark />
      </header>
      <section className="landing__hero">
        <h1>Find your Deadlock story</h1>
        <PlayerSearchForm
          key={q}
          initialQuery={q}
          onSubmit={(query) => navigate({ search: { q: query } })}
        />
      </section>
      <SearchResults
        error={error}
        onRetry={() => router.invalidate()}
        query={q}
        results={results}
      />
      <footer className="landing__footer">
        <span>Community data, not affiliated with Valve</span>
        <span>Records may be incomplete or delayed</span>
      </footer>
    </main>
  )
}

function LinkMark() {
  return (
    <span className="wordmark">
      <i aria-hidden="true">D</i>
      Deadlock Ledger
    </span>
  )
}

function publicSearchError(error: unknown) {
  return toPublicErrorState(error)
}
