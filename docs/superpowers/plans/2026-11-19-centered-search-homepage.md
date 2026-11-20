# Centered Search Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current editorial homepage hero with a calm, centered search experience that compacts upward when a query is present.

**Architecture:** Keep the existing route loader, navigation, search form API, and result rendering intact. Express the two visual states through a query-dependent modifier class on the homepage and focused markup/CSS changes, with Playwright covering the responsive spatial behavior and existing component tests preserving form semantics.

**Tech Stack:** React 19, TanStack Router/Start, TypeScript, global CSS, Vitest/Testing Library, Playwright

**Spec:** `docs/superpowers/specs/2026-11-19-centered-search-homepage-design.md`

## Global Constraints

- Continue using the existing React, TanStack Router, and global CSS structure.
- Preserve search routing, server calls, validation, result content, error handling, footer disclosures, and player-profile behavior.
- Keep the search form semantic and keyboard accessible, with an assistive label and visible focus states.
- Respect reduced-motion preferences.
- Reuse the current dark palette and serif-led brand language.
- Add no new runtime or development dependencies.

## Review Focus

- Empty query at desktop width: heading and search control are centered as one visual group.
- Non-empty query with results: the hero compacts upward and the first result remains visible without scrolling.
- Non-empty query with an error or zero results: the compact state still exposes the message close to the search control.
- Narrow viewport at 320px: the search control remains usable without horizontal overflow or a detached submit action.
- Keyboard and assistive technology: Enter still submits a trimmed query, the searchbox retains the `Steam name or ID` accessible name, and submit focus remains visible.

---

### Task 1: Centered and compact homepage states

**Files:**
- Modify: `src/routes/index.tsx:38-84`
- Modify: `src/components/search/PlayerSearchForm.tsx:15-30`
- Modify: `src/styles.css:57-215`
- Modify: `src/components/search/search.test.tsx:10-28`
- Modify: `tests/e2e/search.spec.ts:1-46`
- Modify: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: existing `PlayerSearchForm({ initialQuery: string, onSubmit: (query: string) => void })`, `SearchResults`, and route search value `q`.
- Produces: query-dependent `landing--searched` state, the existing accessible search form with an icon-style submit control, and responsive centered/compact layouts; no exported API changes.

- [ ] **Step 1: Add failing component coverage for accessible search-control copy and trimmed submission**

  Extend `PlayerSearchForm` tests to assert the searchbox is named `Steam name or ID`, the submit control is named `Search`, and whitespace around ` Ivy ` is trimmed to `Ivy` on submission.

- [ ] **Step 2: Run the focused component test and verify the new submit-name assertion fails**

  Run: `npm test -- src/components/search/search.test.tsx`

  Expected: FAIL because the existing submit button is named `Open the archive`.

- [ ] **Step 3: Add failing Playwright coverage for the two homepage layouts and narrow-screen overflow**

  In `tests/e2e/search.spec.ts`, add tests that:
  - At `1280x800` with `/`, assert the heading center and search-control center differ from the viewport horizontal center by at most 2px.
  - At `1280x800` with `/?q=Ivy`, assert the results status and first player link are visible without scrolling and the heading is above the vertical midpoint.
  - At `320x700` with `/`, assert `document.documentElement.scrollWidth === 320`, the searchbox is visible, and the `Search` button is visible.

  In `tests/e2e/smoke.spec.ts`, retain the existing axe scan and ensure it runs against the redesigned empty homepage.

- [ ] **Step 4: Run the focused end-to-end tests and verify the layout assertions fail**

  Run: `npm run test:e2e -- tests/e2e/search.spec.ts tests/e2e/smoke.spec.ts`

  Expected: FAIL because the current hero is left-aligned, the submit control has the old name, and the mobile layout uses a detached full-width button.

- [ ] **Step 5: Implement the query-dependent route markup**

  In `HomePage`, set the main class to `landing landing--searched` when `q` is non-empty and `landing` otherwise. Remove the masthead status text, eyebrow, and long lede; retain the `Deadlock Ledger` wordmark, `Find your Deadlock story` heading, search form, results, and both footer disclosures. Keep `key={q}`, navigation, loader, retry, and result props unchanged.

- [ ] **Step 6: Implement the integrated search control**

  Keep the visible placeholder and helper text. Convert the visible form label to the existing `.sr-only` treatment, change the submit button accessible name to `Search`, and use a small inline decorative/search glyph with hidden text only if needed; do not add an icon dependency.

- [ ] **Step 7: Implement the centered empty state and compact searched state in CSS**

  Replace the homepage-specific rules with a restrained dark background, centered empty state, pill-shaped search control no wider than `42rem`, compact `landing--searched` layout, and responsive 320px behavior. Preserve focus visibility and reduced-motion behavior, and leave profile/match/system styling unchanged.

- [ ] **Step 8: Run focused tests and make them pass**

  Run: `npm test -- src/components/search/search.test.tsx`

  Run: `npm run test:e2e -- tests/e2e/search.spec.ts tests/e2e/smoke.spec.ts`

- [ ] **Step 9: Run the full verification suite**

  Run: `npm run typecheck && npm test && npm run build && npm run test:e2e`

- [ ] **Step 10: Commit the approved design, plan, implementation, and tests**

  `git commit -m "feat: center homepage search experience"`
