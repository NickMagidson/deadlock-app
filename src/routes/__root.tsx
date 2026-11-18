import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'

import '../styles.css'
import { RouteError } from '../components/system/AppError'
import { EmptyState } from '../components/system/EmptyState'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Deadlock Player Explorer' },
      {
        name: 'description',
        content: 'Find a Deadlock player and uncover the matches that made their story.',
      },
    ],
  }),
  component: RootComponent,
  errorComponent: RouteError,
  notFoundComponent: NotFound,
})

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  return (
    <main className="system-message" id="main-content">
      <h1>This record could not be found</h1>
      <EmptyState
        description="The player or match may no longer be available."
        title="No record here"
      />
      <Link search={{ q: '' }} to="/">
        Return to search
      </Link>
    </main>
  )
}
