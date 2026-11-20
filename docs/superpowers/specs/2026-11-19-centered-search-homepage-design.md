# Centered Search Homepage Design

## Intent

Make the homepage feel calm, immediate, and search-first in the spirit of Google's restraint, while retaining the distinctive dark Deadlock Ledger identity.

## Goals

- Center the primary heading and player search control in the empty landing state.
- Make the search action the unmistakable focus of the page.
- Preserve the existing search behavior, accepted identifier formats, results, error handling, footer disclosures, and accessibility.
- After a search, collapse the hero upward into a compact header so results are immediately visible.
- Keep the layout effective on narrow and wide screens.

## Non-goals and anti-goals

- Do not turn the product into a literal Google clone or replace its Deadlock visual identity with generic white utility styling.
- Do not change search routing, server calls, validation, result content, or player-profile pages.
- Avoid decorative copy and visual effects that compete with the search control.
- Avoid pushing results below the fold after a query.

## Constraints

- Continue using the existing React, TanStack Router, and global CSS structure.
- Keep the search form semantic and keyboard accessible, with a visible label available to assistive technology and clear focus states.
- Respect reduced-motion preferences.
- Reuse the current dark palette and serif-led brand language, simplifying rather than replacing them.

## Approaches considered

1. **Pure utility:** a bright, almost neutral Google analogue. This provides maximum familiarity but discards too much of the product's existing personality.
2. **Focused Deadlock — selected:** Google-like centered composition and restraint with the current dark, archival visual identity. This best balances clarity with brand continuity.
3. **Warm editorial:** a centered cream-toned archive aesthetic. It has personality, but feels less direct and utility-focused than the requested direction.

For the results state, two behaviors were considered: keep the hero centered with results below it, or collapse the hero upward. The compact upward transition was selected because it keeps results visible and avoids wasting vertical space.

## Design details

The empty state uses a full-height composition with a small wordmark at the top, a centered `Find your Deadlock story` heading, and a wide pill-shaped search field directly below it. Supporting input-format guidance remains present but visually quiet. The existing masthead status line and long descriptive paragraph are removed.

The search action should feel integrated with the pill control rather than like a separate heavy rectangular button. On submission, the heading and search control move into a compact upper layout and the result list follows closely underneath. Footer disclosures remain pinned toward the bottom in the empty state and flow after results in the populated state.

## Builder decisions left open

Exact spacing, responsive breakpoints, and the search icon/button treatment may be tuned during implementation, provided the centered empty state, compact results state, visual restraint, and accessible form behavior remain intact.
