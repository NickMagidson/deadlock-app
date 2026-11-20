# Direct Player Search Design

## Intent

Turn the homepage autocomplete into a direct player-profile launcher. Users should choose a concrete Steam player from the suggestions and arrive at that player's `/players/$accountId` route without first loading the homepage's search-results list.

## Goals

- Clicking a suggestion immediately navigates to that player's profile route.
- Pressing Enter while a suggestion is keyboard-active immediately navigates to that player's profile route.
- Pressing Enter without an explicitly selected suggestion does not submit or navigate.
- Move the magnifying-glass icon to the left side of the search input and make it decorative rather than a submit control.
- Preserve the existing debounced suggestions, avatars, Steam names, keyboard navigation, IME protection, focus behavior, and accessible combobox semantics.

## Non-goals and anti-goals

- Do not automatically choose the first suggestion from typed text.
- Do not navigate by display name or retain the intermediate results-list step in this homepage interaction.
- Do not change the player profile route or profile data loading.

## Approach

Two approaches were considered:

1. Add an `onSelect(player)` callback to the existing controlled combobox and keep focus on its input. This preserves the current `aria-activedescendant` keyboard model and routes by the selected player's stable account ID. **Selected.**
2. Render suggestions as native route links. This improves native click semantics but conflicts with the current input-focused combobox behavior and adds more focus-management complexity.

## Interaction and implementation

`PlayerSearchForm` will replace its free-text `onSubmit(query)` contract with a player-selection callback. Mouse click and Enter on an active option will call that callback exactly once with the full `PlayerSearchResult`. The homepage will navigate with TanStack Router to `/players/$accountId`, using `String(player.accountId)`.

The form will continue preventing native submission so Enter without an active option is inert. The current submit button will become a non-interactive leading icon within the search control. The autocomplete popup and option-selection state will remain otherwise unchanged.

The homepage loader and `SearchResults` component may remain available for legacy query URLs and unrelated tests, but normal autocomplete interaction will no longer create a `?q=` results step.

## Verification

Unit tests will prove that click and active-option Enter select the player, that plain Enter does nothing, and that the icon is non-interactive and precedes the input. Browser tests will prove both direct-navigation paths land on `/players/:accountId` without visiting `/?q=...`, alongside the existing typecheck, unit, build, and accessibility suites.
