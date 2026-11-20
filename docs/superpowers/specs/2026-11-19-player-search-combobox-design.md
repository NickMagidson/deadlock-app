# Player Search Combobox Design

## Intent

Help people identify the correct Steam player before submitting a search, without changing the deliberate Enter-to-search interaction of the centered homepage.

## Goals

- Show autocomplete suggestions after the user starts typing.
- Present each suggestion as a compact row containing the player's avatar and Steam display name.
- Let pointer and keyboard users choose a suggestion; selection fills the search field and closes the popup.
- Require Enter or the existing search button to submit, even after a suggestion is selected.
- Preserve the current full-result behavior when Enter is pressed without selecting a suggestion.
- Provide accessible combobox/listbox semantics, visible focus, loading, empty, and error behavior.

## Non-goals and anti-goals

- Do not navigate immediately when a suggestion is selected.
- Do not show suggestions before the user types.
- Do not replace the submitted result list or change player-profile pages.
- Do not add extra metadata to suggestion rows; they contain only avatar and Steam name.
- Do not add a new component-library dependency for this focused interaction.

## Constraints

- Continue using the existing React, TanStack Router, server function, player search result model, and visual language.
- Debounce live requests so typing does not trigger a request for every keystroke.
- Ignore or cancel stale responses so older searches cannot overwrite newer suggestions.
- Keep the existing query validation and Enter-to-submit form semantics.
- Support Arrow Up/Down, Home/End, Enter, Escape, pointer selection, focus transitions, and screen-reader status announcements.

## Approaches considered

1. **Custom accessible combobox — selected:** extend the existing search component with controlled input state, a debounced suggestion request, and explicit ARIA combobox/listbox behavior. This preserves the design, avoids a dependency, and fits the small interaction surface, with tests covering the accessibility-sensitive behavior.
2. **Headless component library:** use React Aria or Downshift for interaction behavior and style it locally. This lowers some implementation risk but adds a dependency and abstraction that the app does not otherwise need.
3. **Native `datalist`:** smallest implementation, but ruled out because browsers control its rendering and cannot reliably provide the required avatar/name rows.

## Interaction design

The popup remains closed while the field is empty. Once the user types, a short debounce starts and matching players are requested. The popup anchors directly beneath the pill-shaped search control and uses the same width. Each option is a row with a circular avatar or existing initials fallback plus the Steam display name.

Arrow keys move the active option without submitting. Pointer selection or Enter on an active option copies that player's display name into the input and closes the popup; neither action navigates. A subsequent Enter, or activating the search button, submits the filled value through the existing route and shows the full matching result rows below the search bar. Enter with no active suggestion submits the user's text normally. Escape closes the popup without clearing the field.

The popup exposes quiet loading and no-match states. Suggestion-request failures close the popup or present a non-blocking status; they do not prevent ordinary form submission. The existing submitted-search error experience remains unchanged.

## Builder decisions

- Use a modest debounce appropriate for perceived immediacy, expected to be roughly 200–300 ms.
- Cap the visible suggestion set to a small number that fits below the centered search field without overwhelming the page.
- Reuse the existing avatar fallback and dark result styling, adjusted into a connected popup surface.
- Keep account IDs out of visible suggestion rows as requested, while retaining stable account IDs internally for option identity.
