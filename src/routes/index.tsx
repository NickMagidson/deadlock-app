import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="site-shell" id="main-content">
      <h1>Find your Deadlock story</h1>
    </main>
  )
}
