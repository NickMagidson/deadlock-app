# Deadlock Player Explorer Design

## Intent

Build a public, shareable Deadlock player analytics application. A visitor searches by Steam display name, SteamID3, or SteamID64, selects the correct player, and lands on a canonical player route that turns community Deadlock API data into an understandable profile. The product emphasizes personal achievements and standout matches rather than coaching, weakness detection, or prescriptive advice.

The application is also a reference-quality TanStack Start implementation: file-based TanStack Router routes, validated URL state, route loaders, typed server functions, full-document SSR, selective SSR, and streamed data must be used deliberately rather than added as demonstrations disconnected from the product.

## Goals

- Let a visitor find a player without signing in.
- Give every player a stable, shareable `/players/$accountId` URL using the canonical SteamID3 account ID.
- Summarize identity, current rank, lifetime/available aggregate statistics, favorite heroes, recent form, achievements, and standout matches.
- Let visitors filter and page through recent matches using validated URL search parameters.
- Provide a focused match detail route for a selected match.
- Render meaningful document HTML on the first request and progressively stream slower dashboard data.
- Remain useful when the upstream community API is incomplete, delayed, rate-limited, or temporarily unavailable.
- Keep all upstream access, validation, normalization, and environment access behind explicit server-only boundaries.
- Keep the application stateless so deployment configuration can target another supported runtime without changing routes, components, or domain behavior.

## Non-goals

- Steam authentication, user accounts, saved favorites, or private profiles.
- A separate API service or custom backend application.
- PostgreSQL, Redis, queues, ingestion jobs, or persistent analytics snapshots.
- Replay processing, video clips, AI-written commentary, competitive coaching, or leaderboards.
- Reproducing every field exposed by the Deadlock API.
- Claiming complete or official data; the upstream service is community maintained.

## Anti-goals

- Do not call the Deadlock API directly from browser code.
- Do not leak upstream response shapes into UI components.
- Do not block the entire player page on its slowest request.
- Do not retry `503` or `504` responses aggressively or ignore `Retry-After`.
- Do not hide missing data by displaying invented zeroes.
- Do not add an application-owned public REST API merely to proxy the upstream API.

## Constraints and chosen defaults

- Use current stable TanStack Start with React, TypeScript, Vite, and file-based TanStack Router.
- Target the community API documented by the OpenAPI 3.1 document at `https://api.deadlock-api.com/openapi.json` (currently API version `0.1.0`). The implementation snapshots only the schemas it consumes and validates live responses rather than trusting generated TypeScript types alone.
- Use Zod at every untrusted boundary: URL search, server-function input, route params where parsing is needed, and upstream JSON.
- Target the Node.js deployment runtime for the first build. Runtime-specific configuration remains isolated to build/deployment files.
- Use the built-in TanStack Router loader cache with short freshness windows; no shared or persistent cache is introduced.
- Use Tailwind CSS for styling and a small local component layer rather than importing a large component system.
- Use accessible semantic HTML, keyboard-operable controls, responsive layouts, reduced-motion-friendly transitions, and high-contrast chart alternatives.
- Treat all statistics as based on available records and label them accordingly.

## Approaches considered

### 1. Live API with server-side aggregation — chosen

TanStack Start server functions call the Deadlock API, validate and normalize its data, and return typed product models. Route loaders compose those calls. Full SSR supplies the initial document and deferred promises stream slower sections. This is stateless, keeps infrastructure small, and preserves the requested application model.

### 2. Live API plus Redis/KV

A shared cache would reduce upstream traffic and improve resilience across instances, but it introduces infrastructure and runtime-specific dependencies before traffic demonstrates a need.

### 3. Persisted analytics platform

Database snapshots and ingestion jobs would enable long-term trends beyond the upstream history window, but they turn the MVP into a data platform and conflict with the explicit “no custom backend for now” constraint.

## Information architecture and routes

### `/`

The landing and search route uses full SSR (`ssr: true`). Its document contains the product promise, a Steam player search form, an explanation of accepted identifiers, and recent-search guidance. Search state is URL-owned and validated as:

- `q`: trimmed string, default `""`, maximum 100 characters.

The loader depends on `q`. With an empty query it returns no results and makes no upstream request. With a valid query it calls the typed player-search server function and renders accessible result cards containing avatar, display name, account identifier, and a link to the canonical profile route. Search submission navigates to `/?q=...`, making results linkable and preserving browser navigation.

Identifier recognition has deterministic precedence. A bracketed `[U:1:123]` value is parsed as SteamID3; a 17-digit value at or above the Steam individual-account offset is parsed as SteamID64 and converted to its 32-bit account ID; an unsigned decimal value within the 32-bit account-ID range is treated as the raw SteamID3 account ID. All other input, including longer/shorter numeric strings, is a display-name search. An exact identifier lookup that finds no profile may fall back to the provider's `steam-search` endpoint using the original text, so a numeric display name is still discoverable. Canonical routes always use the resulting raw 32-bit account ID.

### `/players/$accountId`

The public profile route uses full SSR (`ssr: true`) for discoverability, shareability, and a useful first response. The account parameter is parsed as a positive 32-bit Steam account ID; invalid identifiers produce the route not-found state without calling upstream services.

The route loader starts independent work together, awaits only the small identity/rank/activity payload needed for the first shell, and returns deferred promises for computed statistics/achievements, hero performance, and recent matches. The computed analytics promise derives from the same deferred hero and match results rather than making duplicate upstream requests. The HTML document streams the sections as they resolve under independent Suspense/error boundaries:

1. Player identity and rank shell.
2. Available-record summary cards.
3. Personal achievements.
4. Top heroes.
5. Standout and recent matches.

The page must remain coherent if any streamed section fails. Each failed or missing section gets a compact explanation and a retry action that invalidates the current route.

### `/players/$accountId/matches`

The match explorer uses full SSR (`ssr: true`). Its validated search schema is:

- `hero`: optional positive integer hero ID.
- `result`: `"all" | "wins" | "losses"`, default `"all"`.
- `page`: positive integer, default `1`.

These values are declared in `loaderDeps` so cache and preload identities match the URL. The loader requests a bounded window from the upstream history and applies only transformations that are accurate for that window. Pagination controls and filters use typed links.

The upstream match-history endpoint is not paginated, so the application defines an honest local contract: sort by `start_time` descending, retain the newest 100 valid normal/ranked-or-unranked records, apply the selected hero/result filter to that fixed window, and return pages of 20. The UI shows “Showing matches from the latest 100 available records,” a filtered count for that window, and previous/next controls only; it never claims a lifetime total or fetches more upstream data to fill a sparse filtered page.

### `/players/$accountId/matches/$matchId`

The match detail route uses data-only SSR (`ssr: 'data-only'`). Its loader runs on the server and serializes validated, normalized match data, while the richer interactive scoreboard renders on the client. This demonstrates selective SSR for a route whose content is useful after data preload but whose dense interactive presentation does not need to inflate streamed server markup. A lightweight pending state preserves the player context during navigation.

After validating the metadata response, the loader must find the routed `accountId` among the match participants. If the player did not participate, the route returns not-found rather than rendering a generic match or redirecting; this keeps the nested URL and player-specific interpretation truthful.

### Not-found and error states

The root defines consistent full-document not-found and error boundaries. Product-facing errors distinguish invalid input, no matching player, absent data, upstream rate limiting, upstream timeout, and generic temporary failure. Developer details and raw upstream bodies are never exposed.

## Data flow and server boundary

Browser-facing components and loaders may import only typed server functions or pure domain modules. They never import the upstream client.

Server-only modules own:

- the Deadlock API base URL and optional API key;
- fetch timeouts and abort handling;
- safe query-string construction;
- status mapping, including `Retry-After` for `503` and `504`;
- upstream response validation;
- response normalization into product models;
- conservative cache headers/fetch policy suitable for the Node target.

Typed server functions use `createServerFn({ method: 'GET' })`, validate input with Zod, and return serializable discriminated results or throw typed route-safe errors. They cover:

- `searchPlayers({ query })`;
- `getPlayerSummary({ accountId })` (identity, current rank, and 30-day activity only, so it stays independent of slower analytics sources);
- `getPlayerHeroStats({ accountId })`;
- `getPlayerMatches({ accountId, hero?, result?, page })`;
- `getMatchDetail({ accountId, matchId })`.

Static hero and rank metadata come from the provider's `/v1/assets/heroes` and `/v1/assets/ranks` endpoints through the same server-only client, with longer loader freshness than player data.

The thin server-function layer is part of the TanStack Start application, not a separate backend. No public server routes are added because there is no outside caller.

## Product models

UI code consumes stable internal types, including:

- `PlayerSearchResult`: account ID, display name, avatar URL, profile URL.
- `PlayerSummary`: identity, rank, record coverage, computed aggregate statistics.
- `HeroPerformance`: hero identity, available matches, wins, win rate, K/D/A averages.
- `MatchSummary`: match ID, start time, hero, result, duration, K/D/A, net worth, notable score.
- `PlayerAchievement`: stable kind, title, explanation, supporting metric, and optional match link.
- `PlayerProfile`: summary plus independently resolving hero and match sections.

Unknown or absent upstream fields normalize to `null`/missing values, never fabricated zeroes. Components format the internal models and do not know upstream field names.

The MVP summary uses explicit formulas over the provider's available normal-mode, ranked-and-unranked hero-stat rows: recorded matches and wins are sums across heroes; win rate is `wins / matches`; average kills, deaths, and assists are the corresponding totals divided by recorded matches; KDA is `(kills + assists) / deaths`, or `null` when deaths are zero; favorite heroes are ordered by matches played, then wins, then most recently played. “Recent form” uses the newest 20 valid match-history entries and reports record, average K/D/A, and the delta between the newest 10 and preceding 10 only when both groups contain ten scored matches. The UI labels aggregate and recent sample sizes explicitly. Rank uses the current `/v1/players/{account_id}/rank` response and displays unranked placement state when badge/rank/subrank are zero.

## Achievement and standout-match rules

Achievements are deterministic pure functions over validated available data. The initial rules are intentionally conservative:

- recent win streak of at least three recorded matches;
- hero specialist when a hero has at least ten recorded matches and materially leads the player's available hero results;
- high-impact match based on kills plus assists relative to the player's recent available sample;
- survivor match for an unusually low-death win;
- standout victory selected by a documented composite of result, KDA, participation, and available economy fields.

Every achievement states the sample it uses. Rules return nothing when required data or sample size is missing. The UI uses celebratory but factual language and never presents a relative-to-sample result as a global ranking.

## Caching and upstream protection

- Route loaders use TanStack Router's cache/deduplication with explicit `staleTime` and `gcTime` suited to each data class.
- Identity and static hero metadata may stay fresh longer than match history and rank.
- A request-scoped deduplication helper prevents duplicate upstream calls during one SSR render.
- The application does not automatically retry provider `503`/`504` failures. It surfaces the retry delay when present and lets the user retry after that interval.
- Independent upstream calls use bounded concurrency to avoid load-shedding penalties.
- Fetches have an explicit timeout and preserve abort signals where supported.

## Streaming and rendering behavior

Full-document SSR is the default for the root, search, profile, and match-list routes. The profile route returns a server-rendered identity/summary shell as soon as its critical data resolves, then streams hero and match sections independently. Suspense fallbacks mirror final layout dimensions to reduce layout shift.

Streaming is not simulated with client effects. Deferred loader values originate from server-function calls and are consumed with React Suspense/Await patterns supported by TanStack Start. No server-only value, environment variable, or upstream client crosses the serialization boundary.

## Visual direction

The interface uses a dark, atmospheric “occult newspaper” aesthetic inspired by Deadlock without copying game assets as chrome. Warm parchment text, ink-black surfaces, muted gold accents, and restrained teal/purple performance colors provide hierarchy. The landing page is search-first. The player page uses a strong identity masthead, a compact metric band, achievement cards with evidence, hero cards, and a readable match ledger. Motion is subtle and never required to understand state.

Official/community-served hero and Steam avatar images may be displayed only through validated HTTPS URLs. Missing images receive intentional initials or icon fallbacks.

## Accessibility and metadata

- Every route has a unique title and description derived from validated loader data where available.
- Player routes include canonical URLs and social metadata without making additional client requests.
- Search results and filtering announce loading and result counts appropriately.
- Charts have adjacent textual/tabular summaries; color is never the only signal.
- Skeletons are non-interactive and hidden from assistive technology.
- Focus moves predictably on navigation and retry controls retain clear labels.

## Testing strategy

- Unit tests cover schemas, account-ID normalization, upstream transforms, aggregate calculations, achievement generation, standout scoring, and error mapping.
- Server-function tests exercise validation and normalized behavior with a local fetch substitute at the upstream-client boundary.
- Route tests cover validated/defaulted search parameters, loader dependency identity, invalid params, and partial streamed failures.
- Component tests cover empty, partial, loading, success, and error states with accessible queries.
- Browser tests cover name search to profile, direct Steam ID search, URL-backed match filters, direct profile SSR content, streamed section completion, not-found behavior, and upstream failure recovery.
- Build/typecheck tests verify generated route types and ensure server-only imports do not enter the client bundle.

## Deployment model

The initial output targets Node.js. Only the deployment adapter/build configuration may refer to the runtime. Routes, typed server functions, validation, domain models, and UI remain runtime-neutral Web API code. Moving to another supported target changes deployment configuration and any cache adapter policy, not the application model.

Environment configuration is limited to the Deadlock API base URL, an optional API key, and the public canonical origin. The application must run without an API key under the provider's public limits.

## Success criteria

- A visitor can search by player name or supported Steam identifier and reach a canonical profile.
- Direct requests return meaningful server-rendered HTML before hydration.
- Profile sections stream independently and survive partial upstream failures.
- All URL state and server-function input is validated and typed.
- No browser bundle contains the upstream client, API key access, or server-only transforms.
- Achievements are reproducible from displayed supporting data.
- Production build, typecheck, automated tests, and end-to-end smoke flows pass on the Node target.

## Builder decisions left open

- Exact stable package versions available at implementation time.
- Exact cache durations after observing provider behavior locally.
- Fine-grained breakpoints, spacing, and typography values within the approved visual direction.
- Which available upstream fields can safely support each conservative achievement rule after schema inspection.
