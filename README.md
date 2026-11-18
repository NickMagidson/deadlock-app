# Deadlock Ledger

Deadlock Ledger is a stateless TanStack Start application for finding a Steam player and exploring the achievements, standout matches, hero performance, and recent form available from the community Deadlock API.

The application talks to the Deadlock API through typed TanStack server functions. It does not require a custom backend, database, or browser-side API key.

## Requirements

- Node.js 22.22 or newer
- npm

## Configuration

Create a local `.env` file when overriding the defaults:

```dotenv
DEADLOCK_API_BASE_URL=https://api.deadlock-api.com
DEADLOCK_API_KEY=
```

`DEADLOCK_API_BASE_URL` defaults to the public community API shown above. `DEADLOCK_API_KEY` is optional and must remain server-only. Nitro also accepts its normal `HOST` and `PORT` environment variables when the production server starts.

The data is community-provided, may be incomplete or delayed, and is not affiliated with Valve.

## Development

```bash
npm install
npm run dev
```

The development server listens on `http://127.0.0.1:5173` unless a different port is supplied.

Useful checks:

```bash
npm test
npm run typecheck
npm run build
npm run test:e2e
```

Playwright uses a deterministic local Deadlock API fixture, so browser tests do not depend on the live service.

## Production

### Vercel

Vercel detects the TanStack Start framework from `vercel.json`, and Nitro detects the Vercel build environment to generate the appropriate server and static output. In the Vercel project settings, use `npm run build` as the Build Command and leave **Output Directory** unset.

### Generic Node hosting

For a standalone Node server, build and start the application with:

```bash
npm run build
npm start
```

The deployable server entry is `.output/server/index.mjs`; static client assets are in `.output/public`. Deploy the `.output` directory to a Node 22.22+ runtime and start the server entry with Node.

The process is stateless. Every request derives its data from validated URL parameters and the Deadlock API, with request-scoped deduplication only. Horizontal replicas do not need shared application state.

## Application model

- File-based TanStack Router routes own URL validation and loader dependencies.
- Search and match-list routes use full-document SSR for useful initial HTML.
- Player profiles use full-document SSR for identity and rank, then stream independent analytics, hero, and match sections.
- Match details use data-only SSR so client navigation can show a focused pending state without rendering a second document shell.
- Zod-validated, typed server functions are the only route-to-server interface.
- `src/lib/deadlock/client.server.ts` is the explicit server-only boundary for environment access, upstream URLs, timeouts, and response validation.

TanStack Start's application model does not need to change for another deployment runtime. Change the Nitro preset and any runtime-specific compatibility options in `vite.config.ts`; routes, loaders, server functions, streaming, and server-only modules stay intact.
