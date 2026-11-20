# Player Search Combobox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a debounced, accessible player autocomplete whose avatar/name options fill the search field while preserving Enter-to-submit search behavior.

**Architecture:** Keep `PlayerSearchForm` responsible for the form and ARIA combobox interaction, while a focused `usePlayerSuggestions` hook owns debounce, request state, and stale-response protection. The home route injects the existing `searchPlayers` server function into the form, so submitted results continue to use the current loader and URL flow.

**Tech Stack:** React 19, TypeScript, TanStack Router/Start, Vitest, Testing Library, Playwright, global CSS

**Spec:** `docs/superpowers/specs/2026-11-19-player-search-combobox-design.md`

## Global Constraints

- Suggestions remain closed until the user types a non-empty value.
- Selecting an option fills the field and closes the popup; it never navigates or submits.
- Enter with no active option preserves ordinary form submission and the existing result list.
- Suggestion rows visibly contain only avatar/fallback and Steam display name.
- Add no component-library dependency.
- Debounce live requests and prevent stale responses from replacing newer suggestions.
- Keep existing validation, route state, submitted-search errors, and player-profile behavior intact.

## Review Focus

- Rapidly replacing one query with another must never display the older response; Task 1 tests out-of-order resolution.
- Clearing the field while a request is pending must close the popup and ignore the pending response; Task 1 tests clearing during flight.
- IME/composition and ordinary Enter submission must not accidentally choose or submit the wrong value; Task 2 tests composition plus Enter with and without an active option.
- Blur caused by pointer selection must not close the popup before the option is applied; Task 2 tests pointer selection.
- A failed suggestion request must not block submitting the typed query; Task 2 tests non-blocking failure and Task 3 verifies the full route flow.

---

### Task 1: Debounced suggestion state

**Files:**
- Create: `src/components/search/usePlayerSuggestions.ts`
- Create: `src/components/search/usePlayerSuggestions.test.tsx`

**Interfaces:**
- Consumes: `PlayerSearchResult` from `src/lib/deadlock/models.ts` and an injected async suggestion function.
- Produces: `usePlayerSuggestions(query: string, fetchSuggestions: (query: string) => Promise<PlayerSearchResult[]>, debounceMs?: number): { suggestions: PlayerSearchResult[]; status: 'idle' | 'loading' | 'ready' | 'empty' | 'error' }`.

- [ ] **Step 1: Write failing debounce and request-state tests**

Add tests named `waits for the debounce before requesting suggestions`, `publishes ready and empty results`, and `reports suggestion failures without throwing`. Use fake timers, assert a default 250 ms delay, and assert the exact status transitions.

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `npm test -- src/components/search/usePlayerSuggestions.test.tsx`

Expected: FAIL because `usePlayerSuggestions` does not exist.

- [ ] **Step 3: Implement the hook**

Create the exported hook with the exact signature above. Trim the query, return `idle` with an empty array for blank input, debounce by 250 ms by default, and map resolved arrays to `ready` or `empty`.

- [ ] **Step 4: Run the focused tests and verify passing output**

Run: `npm test -- src/components/search/usePlayerSuggestions.test.tsx`

Expected: all new hook tests PASS.

- [ ] **Step 5: Write failing stale-response tests**

Add tests named `ignores an older response that resolves after the current query` and `ignores a pending response after the query is cleared`. Control promise resolution explicitly and assert that stale players never enter `suggestions`.

- [ ] **Step 6: Run the stale-response tests and verify failure**

Run: `npm test -- src/components/search/usePlayerSuggestions.test.tsx`

Expected: at least one new stale-response assertion FAILS.

- [ ] **Step 7: Add stale-response protection**

Use an effect-scoped cancellation flag or monotonically increasing request token so only the current query publishes state.

- [ ] **Step 8: Run the focused tests and commit**

Run: `npm test -- src/components/search/usePlayerSuggestions.test.tsx`

Expected: all hook tests PASS.

```bash
git add src/components/search/usePlayerSuggestions.ts src/components/search/usePlayerSuggestions.test.tsx
git commit -m "feat: add debounced player suggestions"
```

### Task 2: Accessible combobox interaction and presentation

**Files:**
- Modify: `src/components/search/PlayerSearchForm.tsx`
- Modify: `src/components/search/search.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `usePlayerSuggestions` from Task 1 and `PlayerSearchResult`.
- Produces: `PlayerSearchFormProps` extended with `getSuggestions: (query: string) => Promise<PlayerSearchResult[]>`; the existing `initialQuery: string` and `onSubmit: (query: string) => void` remain unchanged.

- [ ] **Step 1: Write failing render and selection tests**

Add component tests named `opens avatar and Steam-name options after typing`, `fills the field without submitting when an option is clicked`, and `uses initials when an option has no avatar`. Assert `combobox`, `listbox`, and `option` roles; ensure the account ID is not visible inside an option.

- [ ] **Step 2: Run the focused component tests and verify failure**

Run: `npm test -- src/components/search/search.test.tsx`

Expected: new combobox tests FAIL because the popup and `getSuggestions` prop do not exist.

- [ ] **Step 3: Add controlled input and popup rendering**

Extend `PlayerSearchForm` with the exact prop above, controlled query state initialized from `initialQuery`, a stable listbox ID, and options rendered from the hook. The input uses `role="combobox"`, `aria-autocomplete="list"`, `aria-controls`, `aria-expanded`, and `aria-activedescendant`. Options use stable account-ID keys and IDs, circular avatar or initials fallback, and display-name-only visible text.

- [ ] **Step 4: Style the connected popup**

Add `.player-search__combobox`, `.player-suggestions`, and option state styles. Anchor the popup below the existing pill, match its width, preserve the dark palette, constrain height with scrolling, and keep it usable without horizontal overflow at 320 px.

- [ ] **Step 5: Run component tests and verify the basic interaction passes**

Run: `npm test -- src/components/search/search.test.tsx`

Expected: render, click-selection, fallback, and existing submission tests PASS.

- [ ] **Step 6: Write failing keyboard, focus, and failure tests**

Add tests named `moves the active option with arrows and selects it with Enter`, `submits typed text with Enter when no option is active`, `does not select or submit while text is being composed`, `supports Home End and Escape`, `keeps pointer selection when the input blurs`, and `allows submission after suggestion loading fails`. Also assert loading and no-match status announcements.

- [ ] **Step 7: Run the focused component tests and verify failure**

Run: `npm test -- src/components/search/search.test.tsx`

Expected: new keyboard or focus-management assertions FAIL.

- [ ] **Step 8: Implement complete combobox behavior**

Track open state, active index, and composition state. Arrow Down/Up opens and cycles within available options; Home/End move to the bounds; Escape closes and clears the active option; Enter on an active option prevents form submission and fills the display name; Enter without an active option follows existing form submission; Enter during composition does neither. Handle option pointer-down so blur does not preempt selection, reset active state on query changes, and keep suggestion error status non-blocking.

- [ ] **Step 9: Run the focused tests and commit**

Run: `npm test -- src/components/search/search.test.tsx src/components/search/usePlayerSuggestions.test.tsx`

Expected: all search component and hook tests PASS.

```bash
git add src/components/search/PlayerSearchForm.tsx src/components/search/search.test.tsx src/styles.css
git commit -m "feat: add accessible player search combobox"
```

### Task 3: Route integration and browser verification

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `tests/e2e/fixture-server.mjs`
- Modify: `tests/e2e/search.spec.ts`

**Interfaces:**
- Consumes: `PlayerSearchForm.getSuggestions(query)` from Task 2 and existing `searchPlayers({ data: { query } })` server function.
- Produces: live homepage suggestions wired to the production player search endpoint while leaving submitted loader results unchanged.

- [ ] **Step 1: Write failing end-to-end autocomplete tests**

Add Playwright tests named `suggests players after typing and waits for Enter to submit`, `supports keyboard selection without immediate navigation`, `submits unmatched text normally`, `keeps failed suggestions non-blocking`, and `keeps the suggestion popup inside a 320px viewport`. Assert avatar/name rows, URL stability immediately after selection, final `/?q=<name>` navigation only after the next Enter, submitted result rendering, and no horizontal overflow.

- [ ] **Step 2: Expand the fixture search data**

Make the Steam-search fixture return at least two distinct avatar-bearing profiles for a shared partial query and preserve the existing exact-query/error fixtures.

- [ ] **Step 3: Run the focused browser tests and verify failure**

Run: `npm run test:e2e -- tests/e2e/search.spec.ts`

Expected: autocomplete tests FAIL because the route does not provide `getSuggestions`.

- [ ] **Step 4: Wire the route to the form**

Pass `getSuggestions={(query) => searchPlayers({ data: { query } })}` to `PlayerSearchForm`. Do not change the route loader, search schema, URL submission, error mapping, or submitted `SearchResults`.

- [ ] **Step 5: Run focused and full verification**

Run: `npm run test:e2e -- tests/e2e/search.spec.ts`

Expected: focused browser tests PASS.

Run: `npm run typecheck && npm test && npm run build && npm run test:e2e`

Expected: typecheck and build exit 0; all unit and browser tests PASS.

- [ ] **Step 6: Commit the integration**

```bash
git add src/routes/index.tsx tests/e2e/fixture-server.mjs tests/e2e/search.spec.ts
git commit -m "test: verify player search autocomplete flow"
```

### Task 4: Whole-branch accessibility and regression review

**Files:**
- Modify if required by findings: `src/components/search/PlayerSearchForm.tsx`
- Modify if required by findings: `src/styles.css`
- Modify if required by findings: `src/components/search/search.test.tsx`
- Modify if required by findings: `tests/e2e/search.spec.ts`

**Interfaces:**
- Consumes: completed Tasks 1–3.
- Produces: a reviewed branch ready for PR feedback.

- [ ] **Step 1: Run automated accessibility coverage on the open popup**

Extend the existing axe parameterization or add a focused Playwright assertion that opens suggestions and finds no automatically detectable accessibility violations.

- [ ] **Step 2: Verify edge interactions manually through Playwright assertions**

Confirm mouse selection, Arrow Up/Down, Home/End, Escape, Enter selection, second-Enter submission, input clearing, loading, empty, and failure states at desktop and 320 px.

- [ ] **Step 3: Run the full verification suite after any review fixes**

Run: `npm run typecheck && npm test && npm run build && npm run test:e2e`

Expected: every command exits 0 with no failing tests.

- [ ] **Step 4: Commit review fixes if any**

```bash
git add src/components/search/PlayerSearchForm.tsx src/styles.css src/components/search/search.test.tsx tests/e2e/search.spec.ts
git commit -m "fix: harden player search combobox"
```
