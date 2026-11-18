# Deadlock Player Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a stateless, production-ready Deadlock player explorer with searchable Steam profiles, shareable analytics pages, deterministic achievements, match browsing, full-document SSR, and streamed secondary data.

**Architecture:** TanStack Start owns the full application and targets Node.js through Nitro. File-based routes validate URL state and call Zod-validated server functions; those functions alone import the server-only Deadlock client, which validates the upstream OpenAPI subset and normalizes it into stable product models. Critical profile data is awaited for SSR while hero and match sections remain promises rendered through independent Suspense/Await boundaries.

**Tech Stack:** React 19, TypeScript, TanStack Start/Router, Vite, Nitro, Zod, Tailwind CSS, Vitest, Testing Library, Playwright, npm

**Spec:** `docs/superpowers/specs/2026-11-17-deadlock-player-explorer-design.md`

## Global Constraints

- Use current stable TanStack Start with React, TypeScript, Vite, and file-based TanStack Router.
- Use Zod at every untrusted boundary: URL search, server-function input, route params, and upstream JSON.
- Target Node.js with Nitro; runtime-specific code stays in build/deployment configuration.
- Use the Deadlock OpenAPI contract at `https://api.deadlock-api.com/openapi.json`; no separate backend, database, Redis, queues, or public proxy routes.
- Browser-facing modules never import the upstream client or read server environment variables.
- Full SSR is required for `/`, `/players/$accountId`, and `/players/$accountId/matches`; match detail uses `ssr: 'data-only'`.
- Missing fields remain missing/null and never become invented zeroes.
- Do not automatically retry provider `503`/`504`; preserve `Retry-After` in the normalized error.
- The product voice celebrates personal achievements and standout matches, not coaching or weakness detection.
- Use npm and commit each independently passing task when the workspace has been initialized as a Git repository.

## Review Focus

- A numeric Steam display name that looks like an ID: Task 2 tests identifier precedence and fallback-to-name behavior.
- Valid JSON with an upstream schema drift: Task 3 tests rejection and safe error mapping rather than rendering partial nonsense.
- A player with no deaths or too few matches: Task 4 tests `null` KDA and suppression of unsupported achievements.
- One streamed profile request fails after the shell renders: Task 7 tests section-level failure isolation and retry.
- A match exists but the routed player is absent: Task 8 tests a route-safe not-found result.

---

### Task 1: Runnable TanStack Start foundation

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.setup.ts`
- Create: `playwright.config.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `src/router.tsx`
- Create: `src/routes/__root.tsx`
- Create: `src/routes/index.tsx`
- Create: `src/styles.css`
- Generate: `src/routeTree.gen.ts`
- Create: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: none.
- Produces: `getRouter(): Router`, a full HTML root document, scripts `dev`, `build`, `start`, `typecheck`, `test`, and `test:e2e`.

- [ ] **Step 1: Initialize the repository and install the current stable runtime/test dependencies**

Run `git init` if `.git` is absent, create the minimal package manifest, then install TanStack Start/Router, React, Vite, Nitro, Zod, Tailwind, Vitest, Testing Library, jsdom, and Playwright with npm. Do not use a generated example application whose demo code would need to be deleted later.

- [ ] **Step 2: Write the failing browser smoke test**

`tests/e2e/smoke.spec.ts` opens `/` and asserts a document title containing `Deadlock`, one `main` landmark, and an `h1` named `Find your Deadlock story`.

- [ ] **Step 3: Run the smoke test to verify RED**

Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts`

Expected: FAIL because no development server/application entry exists.

- [ ] **Step 4: Build the minimal full-document application shell**

Configure `tanstackStart()`, `nitro()`, React, Tailwind, Vitest, and Node output. Implement `getRouter()` with scroll restoration and intent preloading; implement `__root.tsx` with `HeadContent`, `Outlet`, `Scripts`, accessible skip link, root error/not-found components, and stylesheet import. Implement the index heading only. Set `DEADLOCK_API_BASE_URL`, optional `DEADLOCK_API_KEY`, and `PUBLIC_ORIGIN` in `.env.example` without secrets.

- [ ] **Step 5: Verify GREEN and production output**

Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts && npm run typecheck && npm run build`

Expected: one passing browser test, clean typecheck, and Nitro server output at `.output/server/index.mjs`.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: scaffold TanStack Start app"
```

### Task 2: URL validation and Steam identifier normalization

**Files:**
- Create: `src/domain/steam-id.ts`
- Create: `src/domain/steam-id.test.ts`
- Create: `src/features/search/search.schema.ts`
- Create: `src/features/search/search.schema.test.ts`
- Create: `src/features/matches/match-filters.schema.ts`
- Create: `src/features/matches/match-filters.schema.test.ts`
- Create: `src/features/player/player-params.schema.ts`
- Create: `src/features/player/player-params.schema.test.ts`

**Interfaces:**
- Consumes: Zod.
- Produces: `classifySteamQuery(query: string): SteamQuery`, `accountIdSchema`, `matchIdSchema`, `searchSchema`, `matchFiltersSchema`, and inferred serializable types.

- [ ] **Step 1: Write failing table tests for URL and identifier contracts**

Cover `[U:1:123]`, raw `123`, SteamID64 `76561197960265851` → account ID `123`, whitespace trimming, uint32 overflow, malformed bracket notation, empty search, `q` longer than 100 characters, default `page=1/result='all'`, invalid hero IDs, and positive 64-bit match IDs represented safely as strings. Include a test proving numeric input outside recognized ID shapes remains a name query, enabling provider fallback for numeric display names.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- src/domain/steam-id.test.ts src/features/search/search.schema.test.ts src/features/matches/match-filters.schema.test.ts src/features/player/player-params.schema.test.ts`

Expected: FAIL because the schemas and classifier do not exist.

- [ ] **Step 3: Implement the minimal schemas and classifier**

Use `bigint` internally for SteamID64 conversion with offset `76561197960265728n`, but return only serializable strings/numbers. Export discriminated `SteamQuery` variants `{ kind: 'account-id'; accountId; original }` and `{ kind: 'name'; query }`. Search validation defaults to an empty query; filter validation catches invalid URL values to approved defaults.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `npm test -- src/domain/steam-id.test.ts src/features/search/search.schema.test.ts src/features/matches/match-filters.schema.test.ts src/features/player/player-params.schema.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain src/features
git commit -m "feat: validate player and match URLs"
```

### Task 3: Server-only Deadlock client and upstream normalization

**Files:**
- Create: `src/lib/deadlock/models.ts`
- Create: `src/lib/deadlock/upstream-schemas.ts`
- Create: `src/lib/deadlock/errors.ts`
- Create: `src/lib/deadlock/client.server.ts`
- Create: `src/lib/deadlock/transforms.ts`
- Create: `src/lib/deadlock/client.server.test.ts`
- Create: `src/lib/deadlock/transforms.test.ts`
- Create: `src/test/fixtures/deadlock.ts`

**Interfaces:**
- Consumes: `accountIdSchema`, native `fetch`, `DEADLOCK_API_BASE_URL`, optional `DEADLOCK_API_KEY`.
- Produces: `DeadlockApiError`, `deadlockFetch<T>(path, schema, options): Promise<T>`, upstream Zod schemas, and transforms to `PlayerSearchResult`, `PlayerIdentitySource`, `HeroPerformanceSource`, `MatchSummary`, and asset lookup maps.

- [ ] **Step 1: Write failing client and transform tests against complete fixtures**

Tests assert HTTPS-safe avatar/profile normalization, required-field preservation, unknown-field tolerance, schema-drift rejection, timeout/abort mapping, `404`, `429`, `503`, and `504` mapping, parsed `Retry-After`, absence of automatic retries, optional API-key header behavior, and filtering of malformed match records. Derive expected values as literals, not through production helpers.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- src/lib/deadlock/client.server.test.ts src/lib/deadlock/transforms.test.ts`

Expected: FAIL because the server client and transforms do not exist.

- [ ] **Step 3: Implement the client boundary and schemas**

`client.server.ts` is the only module that builds upstream URLs or reads private environment values. Accept an injected `fetchImpl` only in a factory used by tests; production exports use global fetch. Apply an explicit abort timeout, safe `URL`/`URLSearchParams`, Zod `safeParse`, and typed error categories `invalid-response | not-found | rate-limited | timeout | unavailable | unknown`. Never include raw bodies in user-facing messages.

- [ ] **Step 4: Implement focused transforms and product models**

Keep upstream field names inside `upstream-schemas.ts`/`transforms.ts`; output stable camelCase product models with nullable missing values and string match IDs to avoid JSON precision loss.

- [ ] **Step 5: Run tests and verify the server-only boundary**

Run: `npm test -- src/lib/deadlock/client.server.test.ts src/lib/deadlock/transforms.test.ts && npm run typecheck`

Expected: PASS and no browser-facing module imports `client.server.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/deadlock src/test/fixtures
git commit -m "feat: add validated Deadlock API client"
```

### Task 4: Player analytics, achievements, and match-window domain logic

**Files:**
- Create: `src/domain/player-analytics.ts`
- Create: `src/domain/player-analytics.test.ts`
- Create: `src/domain/achievements.ts`
- Create: `src/domain/achievements.test.ts`
- Create: `src/domain/match-window.ts`
- Create: `src/domain/match-window.test.ts`

**Interfaces:**
- Consumes: normalized hero and match sources from Task 3.
- Produces: `buildPlayerSummary(input): PlayerStats`, `buildRecentForm(matches): RecentForm | null`, `generateAchievements(input): PlayerAchievement[]`, `scoreStandoutMatches(matches): ScoredMatch[]`, and `getMatchPage(matches, filters): MatchPage`.

- [ ] **Step 1: Write failing analytics tests**

Assert literal results for summed matches/wins, win rate, per-match K/D/A, `(kills + assists) / deaths`, `null` KDA at zero deaths, favorite-hero ordering, 20-match recent form, and no ten-vs-ten delta when either side lacks ten scored matches.

- [ ] **Step 2: Write failing achievement and match-window tests**

Cover a three-win streak, hero-specialist minimum of ten matches, high-impact/survivor evidence, deterministic standout ordering/ties, suppression for insufficient samples, newest-100 truncation before filters, 20-row pages, invalid/unscored outcome exclusion, sparse filtered pages, and no false lifetime total.

- [ ] **Step 3: Run tests to verify RED**

Run: `npm test -- src/domain/player-analytics.test.ts src/domain/achievements.test.ts src/domain/match-window.test.ts`

Expected: FAIL because domain functions do not exist.

- [ ] **Step 4: Implement minimal pure functions**

Use the exact formulas and ordering from the design. Centralize deterministic thresholds as named domain constants only where behavior depends on them. Every achievement carries its supporting sample text and optional match link data.

- [ ] **Step 5: Run tests to verify GREEN**

Run: `npm test -- src/domain/player-analytics.test.ts src/domain/achievements.test.ts src/domain/match-window.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain
git commit -m "feat: calculate player achievements"
```

### Task 5: Typed server functions and request composition

**Files:**
- Create: `src/server/player.functions.ts`
- Create: `src/server/player.service.server.ts`
- Create: `src/server/player.service.server.test.ts`
- Create: `src/server/request-cache.server.ts`
- Create: `src/server/request-cache.server.test.ts`

**Interfaces:**
- Consumes: Task 2 schemas, Task 3 client/transforms, Task 4 domain functions.
- Produces: `searchPlayers`, `getPlayerSummary`, `getPlayerHeroStats`, `getPlayerMatches`, `getMatchDetail` as Zod-validated GET server functions; `getPlayerSummary` contains identity/rank/30-day activity only, and internal service functions have the same serializable input/output contracts.

- [ ] **Step 1: Write failing service tests**

Test empty-query short circuit, exact ID lookup, ID-miss fallback to original-text search, result limit 10, concurrent identity/rank summary sources, no `force_refetch`, fixed 100-match window, page/filter forwarding, static asset lookup, request-scoped deduplication, and player-not-in-match returning a not-found result. Use a real service with an injected fake upstream port rather than asserting mock existence.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- src/server/player.service.server.test.ts src/server/request-cache.server.test.ts`

Expected: FAIL because the service does not exist.

- [ ] **Step 3: Implement the request-scoped service**

Define a small `DeadlockPort` of exact async methods and make production adapt the server-only client to it. Compose independent profile/rank/history/hero/assets requests with bounded concurrency. Request cache keys include endpoint and normalized input and live only for the SSR request.

- [ ] **Step 4: Wrap service functions with typed server functions**

Each `createServerFn({ method: 'GET' })` calls `.validator(zodSchema)` before its handler. Export only serializable product results. Convert internal errors to safe discriminated errors that route error components can render.

- [ ] **Step 5: Run tests and typecheck**

Run: `npm test -- src/server/player.service.server.test.ts src/server/request-cache.server.test.ts && npm run typecheck`

Expected: PASS with end-to-end type inference at every server-function call site.

- [ ] **Step 6: Commit**

```bash
git add src/server
git commit -m "feat: expose typed player server functions"
```

### Task 6: Search experience and canonical navigation

**Files:**
- Modify: `src/routes/index.tsx`
- Create: `src/components/search/PlayerSearchForm.tsx`
- Create: `src/components/search/SearchResults.tsx`
- Create: `src/components/search/search.test.tsx`
- Create: `tests/e2e/search.spec.ts`

**Interfaces:**
- Consumes: `searchSchema`, `searchPlayers`, typed `/players/$accountId` links.
- Produces: URL-owned player search with SSR results and canonical profile navigation.

- [ ] **Step 1: Write failing component and route-flow tests**

Component tests cover empty state, accessible result count, missing avatar fallback, provider errors, and keyboard submission. Browser tests assert `/?q=...`, direct URL reload preserving results, name search selection, raw account ID lookup, and a numeric-name fallback fixture.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- src/components/search/search.test.tsx && npm run test:e2e -- tests/e2e/search.spec.ts`

Expected: FAIL because search UI/loader behavior is absent.

- [ ] **Step 3: Implement the full-SSR search route**

Set `ssr: true`, `validateSearch: searchSchema`, `loaderDeps: ({ search: { q } }) => ({ q })`, and a loader that short-circuits empty `q`. Submit through typed router navigation, render semantic result links, add route metadata, and avoid client effects for initial loading.

- [ ] **Step 4: Apply the approved landing-page visual system**

Implement the dark occult-newspaper styling in Tailwind/CSS with a search-first responsive composition, clear focus states, reduced-motion rules, and no copied game art.

- [ ] **Step 5: Run tests to verify GREEN**

Run: `npm test -- src/components/search/search.test.tsx && npm run test:e2e -- tests/e2e/search.spec.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/routes/index.tsx src/components/search src/styles.css tests/e2e/search.spec.ts
git commit -m "feat: add Steam player search"
```

### Task 7: Full-SSR profile with streamed sections

**Files:**
- Create: `src/routes/players.$accountId.tsx`
- Create: `src/components/player/PlayerHeader.tsx`
- Create: `src/components/player/StatsOverview.tsx`
- Create: `src/components/player/AchievementGrid.tsx`
- Create: `src/components/player/HeroGrid.tsx`
- Create: `src/components/player/RecentMatches.tsx`
- Create: `src/components/player/SectionBoundary.tsx`
- Create: `src/components/player/player-profile.test.tsx`
- Create: `tests/e2e/player-profile.spec.ts`

**Interfaces:**
- Consumes: `accountIdSchema`, summary/hero/match server functions, `PlayerAchievement`, typed match links.
- Produces: server-rendered profile shell plus independently streamed hero and match sections.

- [ ] **Step 1: Write failing profile tests**

Component tests cover complete, partial, missing-image, unranked, zero-match, section-error, retry, and skeleton accessibility states. Browser tests request a profile directly and assert meaningful identity/summary HTML before hydration, later streamed hero/match content, one rejected stream leaving other sections intact, route invalidation on retry, and invalid account not-found without an upstream call.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- src/components/player/player-profile.test.tsx && npm run test:e2e -- tests/e2e/player-profile.spec.ts`

Expected: FAIL because the profile route/components do not exist.

- [ ] **Step 3: Implement the profile loader and streaming contract**

Set `ssr: true`. Parse `accountId`; begin identity/rank summary, hero, and match calls together; await summary only; return unresolved `heroes` and `matches` promises plus an `analytics` promise derived with `Promise.all([heroes, matches])` and Task 4's pure functions. Do not issue duplicate upstream requests. Render analytics, heroes, and matches inside separate React `Suspense` plus TanStack Router `Await` boundaries, each wrapped by a resettable section error boundary whose retry invalidates the route.

- [ ] **Step 4: Implement profile presentation and metadata**

Render identity masthead, available-record metric band, evidence-bearing achievements, hero grid, and recent/standout match ledger. Add loader-derived title, description, canonical URL, and social metadata. Skeleton dimensions mirror final sections and are hidden from assistive technology.

- [ ] **Step 5: Run tests, inspect SSR, and verify GREEN**

Run: `npm test -- src/components/player/player-profile.test.tsx && npm run test:e2e -- tests/e2e/player-profile.spec.ts && npm run typecheck`

Expected: PASS; direct page source contains critical player content, with deferred sections arriving later.

- [ ] **Step 6: Commit**

```bash
git add src/routes/players.\$accountId.tsx src/components/player tests/e2e/player-profile.spec.ts
git commit -m "feat: stream player profile analytics"
```

### Task 8: Match explorer and data-only match detail

**Files:**
- Create: `src/routes/players.$accountId.matches.tsx`
- Create: `src/routes/players.$accountId.matches.$matchId.tsx`
- Create: `src/components/matches/MatchFilters.tsx`
- Create: `src/components/matches/MatchTable.tsx`
- Create: `src/components/matches/MatchScoreboard.tsx`
- Create: `src/components/matches/matches.test.tsx`
- Create: `tests/e2e/matches.spec.ts`

**Interfaces:**
- Consumes: account/match schemas, `matchFiltersSchema`, `getPlayerMatches`, `getMatchDetail`.
- Produces: URL-backed filtered/paged match history and client-rendered match scoreboard from server-loaded data.

- [ ] **Step 1: Write failing match UI and browser tests**

Cover accessible filter labels, typed URL changes, page reset when filters change, 20-row page, fixed-window disclosure, previous/next boundaries, direct SSR match-list content, data-only detail pending state, valid player participation, and not-found when metadata lacks the routed player.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- src/components/matches/matches.test.tsx && npm run test:e2e -- tests/e2e/matches.spec.ts`

Expected: FAIL because match routes/components do not exist.

- [ ] **Step 3: Implement the full-SSR match explorer**

Set `ssr: true`, validate search, list every filter in `loaderDeps`, and call `getPlayerMatches`. Filters and pagination use typed links/search reducers, preserve unrelated approved state, and never claim results beyond the latest 100 available records.

- [ ] **Step 4: Implement data-only match detail**

Set `ssr: 'data-only'`, validate both route params, load normalized metadata on the server, and render a client-side scoreboard focused on the routed player. Preserve player context in the pending component; map absent player participation to not-found.

- [ ] **Step 5: Run tests to verify GREEN**

Run: `npm test -- src/components/matches/matches.test.tsx && npm run test:e2e -- tests/e2e/matches.spec.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/routes/players.\$accountId.matches* src/components/matches tests/e2e/matches.spec.ts
git commit -m "feat: explore player matches"
```

### Task 9: Production hardening and final verification

**Files:**
- Modify: `src/routes/__root.tsx`
- Modify: `src/styles.css`
- Create: `src/components/system/AppError.tsx`
- Create: `src/components/system/EmptyState.tsx`
- Create: `src/components/system/system.test.tsx`
- Create: `tests/e2e/resilience.spec.ts`
- Create: `README.md`

**Interfaces:**
- Consumes: all prior route-safe errors and UI states.
- Produces: cohesive error/not-found UX, documented Node operation, and release evidence.

- [ ] **Step 1: Write failing resilience and accessibility tests**

Test invalid search, no results, upstream `404`, `429`, `503` with retry delay, `504`, malformed JSON, offline/generic failure, focus-visible retry, skip link, landmark structure, reduced-motion behavior, and no accessibility violations in the core search/profile/matches flows.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- src/components/system/system.test.tsx && npm run test:e2e -- tests/e2e/resilience.spec.ts`

Expected: FAIL for the missing system UI and resilience behavior.

- [ ] **Step 3: Implement shared system states and responsive polish**

Map every error category to concise product language and retry eligibility. Complete responsive layouts, focus behavior, textual chart/table alternatives, safe image fallbacks, and mobile match presentation. Do not expose raw upstream messages.

- [ ] **Step 4: Document local and production operation**

README covers environment variables, `npm run dev`, test commands, Node build/start, `.output/server/index.mjs`, stateless architecture, community-data caveat, and how a future runtime change stays confined to Vite/Nitro configuration.

- [ ] **Step 5: Run the complete release gate**

Run: `npm test && npm run typecheck && npm run build && npm run test:e2e`

Expected: all unit/component/browser tests pass, typecheck is clean, and the Node production build succeeds without warnings attributable to application code.

- [ ] **Step 6: Inspect the production client bundle boundary**

Run a production bundle inspection and confirm `DEADLOCK_API_KEY`, environment-access code, and `client.server.ts` are absent from client assets. Start `.output/server/index.mjs`, request `/`, one profile, and one matches URL, and confirm expected HTTP status and SSR text.

- [ ] **Step 7: Commit**

```bash
git add README.md src tests package.json package-lock.json
git commit -m "chore: harden Deadlock explorer release"
```
