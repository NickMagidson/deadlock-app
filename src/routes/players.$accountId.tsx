import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/players/$accountId')({
  ssr: true,
  component: PlayerRoutePlaceholder,
})

function PlayerRoutePlaceholder() {
  const { accountId } = Route.useParams()
  return (
    <main className="system-message" id="main-content">
      <p className="eyebrow">Player archive</p>
      <h1>Profile {accountId}</h1>
      <p>This player record is being assembled.</p>
    </main>
  )
}
