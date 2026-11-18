import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { PlayerSearchForm } from '../components/search/PlayerSearchForm'
import { SearchResults } from '../components/search/SearchResults'
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

  return (
    <main className="landing" id="main-content">
      <header className="landing__masthead">
        <LinkMark />
        <span>Player archives · available records</span>
      </header>
      <section className="landing__hero">
        <p className="eyebrow">Search the city</p>
        <h1>Find your Deadlock story</h1>
        <p className="landing__lede">
          Turn the matches in your available record into a profile of signature heroes,
          standout victories, and the moments worth remembering.
        </p>
        <PlayerSearchForm
          key={q}
          initialQuery={q}
          onSubmit={(query) => navigate({ search: { q: query } })}
        />
      </section>
      <SearchResults error={error} query={q} results={results} />
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
  const message = error instanceof Error ? error.message : ''
  const safeMessages = new Set([
    'Deadlock is busy. Please try again later.',
    'Deadlock is temporarily unavailable.',
    'Deadlock took too long to respond.',
    'Deadlock could not be reached.',
  ])
  return safeMessages.has(message)
    ? message
    : 'The player archive could not be searched right now.'
}
