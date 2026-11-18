import { Suspense } from 'react'
import { Await, createFileRoute, notFound, useRouter } from '@tanstack/react-router'

import { AchievementGrid } from '../components/player/AchievementGrid'
import { HeroGrid } from '../components/player/HeroGrid'
import { PlayerHeader } from '../components/player/PlayerHeader'
import { RecentMatches, StandoutMatches } from '../components/player/RecentMatches'
import { SectionBoundary, SectionSkeleton } from '../components/player/SectionBoundary'
import { StatsOverview } from '../components/player/StatsOverview'
import { hasErrorCode, RouteError } from '../components/system/AppError'
import { generateAchievements, scoreStandoutMatches } from '../domain/achievements'
import { buildPlayerSummary, buildRecentForm } from '../domain/player-analytics'
import { accountIdSchema } from '../features/player/player-params.schema'
import { getPlayerHeroStats, getPlayerMatches, getPlayerSummary } from '../server/player.functions'

export const Route = createFileRoute('/players/$accountId')({
  ssr: true,
  loader: async ({ params }) => {
    const parsed = accountIdSchema.safeParse(params.accountId)
    if (!parsed.success) throw notFound()
    const accountId = parsed.data
    const summaryPromise = getPlayerSummary({ data: { accountId } })
    const heroes = getPlayerHeroStats({ data: { accountId } })
    const matches = getPlayerMatches({
      data: { accountId, page: 1, result: 'all' },
    })
    void heroes.catch(() => undefined)
    void matches.catch(() => undefined)
    let summary
    try {
      summary = await summaryPromise
    } catch (error) {
      if (hasErrorCode(error, 'not-found') || (error instanceof Error && error.message === 'This player could not be found.')) {
        throw notFound()
      }
      throw error
    }
    const analytics = Promise.all([heroes, matches]).then(([heroRows, matchPage]) => ({
      stats: buildPlayerSummary(heroRows),
      recentForm: buildRecentForm(matchPage.items),
      achievements: generateAchievements({ heroes: heroRows, matches: matchPage.items }),
      standouts: scoreStandoutMatches(matchPage.items).slice(0, 3),
    }))
    return { summary, heroes, matches, analytics }
  },
  errorComponent: RouteError,
  head: ({ loaderData, params }) => ({
    meta: [
      { title: loaderData ? `${loaderData.summary.identity.displayName} — Deadlock Ledger` : 'Deadlock player' },
      {
        name: 'description',
        content: loaderData
          ? `Achievements, heroes, and standout matches for ${loaderData.summary.identity.displayName}.`
          : 'A Deadlock player archive.',
      },
    ],
    links: [{ rel: 'canonical', href: `/players/${params.accountId}` }],
  }),
  component: PlayerProfileRoute,
})

function PlayerProfileRoute() {
  const { summary, heroes, matches, analytics } = Route.useLoaderData()
  const router = useRouter()
  const retry = () => router.invalidate()

  return (
    <main className="profile-page" id="main-content">
      <nav className="profile-nav" aria-label="Profile navigation">
        <a href="/?q=">Deadlock Ledger</a>
        <span>Available-record analytics</span>
      </nav>
      <PlayerHeader summary={summary} />
      <SectionBoundary name="Player analytics" onRetry={retry} resetKey={analytics}>
        <Suspense fallback={<SectionSkeleton label="Loading player analytics" />}>
          <Await promise={analytics}>
            {(data) => (
              <>
                <StatsOverview recentForm={data.recentForm} stats={data.stats} />
                <AchievementGrid accountId={summary.identity.accountId} achievements={data.achievements} />
                <StandoutMatches accountId={summary.identity.accountId} standouts={data.standouts} />
              </>
            )}
          </Await>
        </Suspense>
      </SectionBoundary>
      <SectionBoundary name="Hero performance" onRetry={retry} resetKey={heroes}>
        <Suspense fallback={<SectionSkeleton label="Loading heroes" />}>
          <Await promise={heroes}>{(data) => <HeroGrid heroes={data} />}</Await>
        </Suspense>
      </SectionBoundary>
      <SectionBoundary name="Recent matches" onRetry={retry} resetKey={matches}>
        <Suspense fallback={<SectionSkeleton label="Loading recent matches" />}>
          <Await promise={matches}>{(data) => <RecentMatches accountId={summary.identity.accountId} page={data} />}</Await>
        </Suspense>
      </SectionBoundary>
    </main>
  )
}
