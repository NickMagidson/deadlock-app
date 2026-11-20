# Direct Player Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make explicit autocomplete selection navigate directly to the selected player's dynamic profile route, with a decorative search icon on the input's left.

**Architecture:** Keep the input-focused ARIA combobox and its suggestion data flow. Replace free-text submission with a typed player-selection callback, then let the homepage own TanStack Router navigation by `accountId`; retain legacy `?q=` loader behavior only for direct URLs.

**Tech Stack:** React 19, TypeScript, TanStack Router, Vitest, Testing Library, Playwright, CSS

**Spec:** `docs/superpowers/specs/2026-11-20-direct-player-search-design.md`

## Global Constraints

- Only an explicitly clicked or keyboard-active suggestion may navigate.
- Plain Enter, unmatched text, loading, and suggestion errors must not submit or navigate.
- Navigate by `PlayerSearchResult.accountId`, never by display name.
- Preserve debouncing, avatars, names, keyboard navigation, IME protection, scrolling, and accessible combobox semantics.
- The magnifying-glass icon is decorative, non-interactive, and visually left of the input.

## Review Focus

- Enter before suggestions resolve must remain inert; Task 1 pins this with a callback assertion.
- Enter after Escape, with no active option, must remain inert; Task 1 pins this after the existing Escape flow.
- IME completion followed by key code 229 must not navigate; Task 1 retains and updates the composition regression.
- Clicking an option after input blur/pointer-down must select exactly once; Task 1 pins callback count and payload.
- Direct navigation must preserve large numeric account IDs as strings; Task 2 pins the route URL from the fixture account ID.

---

### Task 1: Direct-selection combobox contract and leading icon

**Files:**
- Modify: `src/components/search/PlayerSearchForm.tsx`
- Modify: `src/components/search/search.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `PlayerSearchResult` from `src/lib/deadlock/models.ts` and existing `getSuggestions(query: string): Promise<PlayerSearchResult[]>`.
- Produces: `PlayerSearchForm` prop `onSelect: (player: PlayerSearchResult) => void`; click or active-option Enter invokes it exactly once.

- [ ] **Step 1: Write failing unit tests for the new selection contract**

Update the existing click, keyboard, composition, Escape, loading/error, and plain-Enter tests to pass `onSelect`. Assert: click returns the complete selected player once; active Enter returns the active player once; plain Enter before/without an active option returns nothing; Escape then Enter returns nothing; IME Enter returns nothing. Add a DOM-order assertion that `.player-search__icon` precedes the combobox input and assert no Search button exists.

- [ ] **Step 2: Run the focused tests to verify RED**

Run: `npm test -- src/components/search/search.test.tsx`

Expected: FAIL because `onSelect` is not accepted, selected options still fill the input, and the icon is still a submit button after the input.

- [ ] **Step 3: Implement the `onSelect` contract and inert form submission**

Change the props to `onSelect: (player: PlayerSearchResult) => void`. Keep `submit(event)` only to prevent default. Replace `selectSuggestion` state-filling behavior with `onSelect(player)`, while retaining popup cleanup needed before navigation. Active Enter calls this selector; Enter without `activeIndex` does nothing.

- [ ] **Step 4: Move the icon before the input and restyle it**

Replace the submit button with `<span className="player-search__icon" aria-hidden="true">…</span>` before the input. Move the button-specific icon sizing/color/padding rules to `.player-search__icon`; adjust input padding for the new leading layout and remove obsolete search-button hover/focus rules without changing shared system-message button styles.

- [ ] **Step 5: Run the focused tests to verify GREEN**

Run: `npm test -- src/components/search/search.test.tsx`

Expected: all focused tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/search/PlayerSearchForm.tsx src/components/search/search.test.tsx src/styles.css
git commit -m "feat: select players directly from search"
```

### Task 2: Profile-route navigation and browser regression coverage

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `tests/e2e/search.spec.ts`

**Interfaces:**
- Consumes: Task 1's `onSelect(player: PlayerSearchResult): void` callback.
- Produces: homepage selection navigation to `navigate({ to: '/players/$accountId', params: { accountId: String(player.accountId) } })`.

- [ ] **Step 1: Write failing browser tests for direct navigation**

Replace the prior two-step click and keyboard tests with assertions that clicking Ivy navigates immediately to `/players/123`, and ArrowDown/ArrowDown/Enter on Pocket navigates immediately to `/players/456`. Update unmatched-text and suggestion-error tests to assert Enter leaves the URL `/` and no result/error page appears. Assert the leading icon's bounding box is left of the input's text box and that no Search button is exposed.

- [ ] **Step 2: Run the focused browser tests to verify RED**

Run: `E2E_APP_PORT=3200 E2E_API_PORT=3300 npm run test:e2e -- tests/e2e/search.spec.ts -g "directly|unmatched|failed suggestions|leading icon"`

Expected: FAIL because selection still creates/fills a query step and the icon is on the right.

- [ ] **Step 3: Wire selection to the dynamic route**

In `HomePage`, replace `onSubmit` with `onSelect={(player) => navigate({ to: '/players/$accountId', params: { accountId: String(player.accountId) } })}`. Keep `SearchResults` and the existing loader for direct legacy `?q=` URLs, but do not reach them through form interaction.

- [ ] **Step 4: Run focused and full verification**

Run:

```bash
npm run typecheck
npm test
npm run build
E2E_APP_PORT=3200 E2E_API_PORT=3300 npm run test:e2e
```

Expected: typecheck and build exit 0; all unit and browser tests pass, including the open-popup accessibility scan.

- [ ] **Step 5: Commit**

```bash
git add src/routes/index.tsx tests/e2e/search.spec.ts
git commit -m "feat: route selected players to profiles"
```
