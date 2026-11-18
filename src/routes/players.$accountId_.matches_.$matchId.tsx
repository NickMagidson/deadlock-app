import { createFileRoute, notFound } from '@tanstack/react-router'

import { MatchScoreboard } from '../components/matches/MatchScoreboard'
import { accountIdSchema, matchIdSchema } from '../features/player/player-params.schema'
import { getMatchDetail } from '../server/player.functions'

export const Route = createFileRoute('/players/$accountId_/matches_/$matchId')({
  ssr: 'data-only',
  loader: async ({ params }) => {
    const accountId = accountIdSchema.safeParse(params.accountId)
    const matchId = matchIdSchema.safeParse(params.matchId)
    if (!accountId.success || !matchId.success) throw notFound()
    try {
      return await getMatchDetail({
        data: { accountId: accountId.data, matchId: matchId.data },
      })
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'This player did not participate in the requested match.'
      ) {
        throw notFound()
      }
      throw error
    }
  },
  pendingComponent: PendingMatch,
  component: MatchDetail,
})

function PendingMatch() {
  const { matchId } = Route.useParams()
  return (
    <main className="match-pending" id="main-content">
      <p>Opening match {matchId}…</p>
    </main>
  )
}

function MatchDetail() {
  const detail = Route.useLoaderData()
  const { accountId } = Route.useParams()
  return (
    <main className="match-detail-page" id="main-content">
      <a href={`/players/${accountId}/matches`}>← Match explorer</a>
      <MatchScoreboard detail={detail} />
    </main>
  )
}
