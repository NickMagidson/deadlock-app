import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
  type ErrorComponentProps,
} from '@tanstack/react-router'

import '../styles.css'

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
  errorComponent: RootError,
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

function RootError({ reset }: ErrorComponentProps) {
  return (
    <main className="system-message" id="main-content">
      <h1>The archive is temporarily unavailable</h1>
      <p>Something interrupted this request. Try loading it again.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </main>
  )
}

function NotFound() {
  return (
    <main className="system-message" id="main-content">
      <h1>This record could not be found</h1>
      <p>The player or match may no longer be available.</p>
      <Link search={{ q: '' }} to="/">
        Return to search
      </Link>
    </main>
  )
}
