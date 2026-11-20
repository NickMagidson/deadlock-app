import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { PlayerSearchResult } from '../../lib/deadlock/models'
import { PlayerSearchForm } from './PlayerSearchForm'
import { SearchResults } from './SearchResults'

describe('PlayerSearchForm', () => {
  it('marks the combobox as hydrated when it is interactive', () => {
    render(
      <PlayerSearchForm
        getSuggestions={async () => []}
        initialQuery=""
        onSelect={() => undefined}
      />,
    )

    expect(screen.getByRole('combobox', { name: 'Steam name or ID' })).toHaveAttribute(
      'data-hydrated',
      'true',
    )
  })

  it('preserves text entered before hydration without selecting a player', async () => {
    const onSelect = vi.fn()
    const element = (
      <PlayerSearchForm
        getSuggestions={async () => []}
        initialQuery=""
        onSelect={onSelect}
      />
    )
    const container = document.createElement('div')
    container.innerHTML = renderToString(element)
    document.body.append(container)
    const input = container.querySelector('input')!
    input.value = 'EarlyTyped'

    let root: ReturnType<typeof hydrateRoot>
    await act(async () => {
      root = hydrateRoot(container, element)
    })
    fireEvent.submit(container.querySelector('form')!)

    expect(input).toHaveValue('EarlyTyped')
    expect(onSelect).not.toHaveBeenCalled()
    await act(async () => root.unmount())
    container.remove()
  })

  it('does not select typed text with Enter when no option is active', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <PlayerSearchForm
        getSuggestions={async () => []}
        initialQuery=""
        onSelect={onSelect}
      />,
    )

    await user.type(screen.getByRole('combobox', { name: 'Steam name or ID' }), 'Ivy')
    await user.keyboard('{Enter}')

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('places a decorative search icon before the input', () => {
    const { container } = render(
      <PlayerSearchForm
        getSuggestions={async () => []}
        initialQuery=""
        onSelect={() => undefined}
      />,
    )

    const control = container.querySelector('.player-search__control')!
    const icon = control.querySelector('.player-search__icon')!
    const input = screen.getByRole('combobox', { name: 'Steam name or ID' })
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(icon.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument()
  })

  it('opens avatar and Steam-name options after typing', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <PlayerSearchForm
        getSuggestions={async () => [result({ avatarUrl: 'https://cdn.example.com/ivy.jpg' })]}
        initialQuery=""
        onSelect={() => undefined}
      />,
    )

    const input = screen.getByRole('combobox', { name: 'Steam name or ID' })
    await user.type(input, 'Iv')

    const listbox = await screen.findByRole('listbox', { name: 'Player suggestions' })
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(within(listbox).getByRole('option', { name: 'Ivy' })).toBeVisible()
    expect(container.querySelector('.player-suggestions img')).toHaveAttribute(
      'src',
      'https://cdn.example.com/ivy.jpg',
    )
    expect(within(listbox).queryByText('123')).not.toBeInTheDocument()
  })

  it('selects the complete player once when an option is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <PlayerSearchForm
        getSuggestions={async () => [result()]}
        initialQuery=""
        onSelect={onSelect}
      />,
    )

    const input = screen.getByRole('combobox', { name: 'Steam name or ID' })
    await user.type(input, 'Iv')
    await user.click(await screen.findByRole('option', { name: 'Ivy' }))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(result())
  })

  it('uses initials when an option has no avatar', async () => {
    const user = userEvent.setup()
    render(
      <PlayerSearchForm
        getSuggestions={async () => [result({ displayName: 'Pocket', avatarUrl: null })]}
        initialQuery=""
        onSelect={() => undefined}
      />,
    )

    await user.type(screen.getByRole('combobox', { name: 'Steam name or ID' }), 'Po')

    const option = await screen.findByRole('option', { name: 'Pocket' })
    expect(within(option).getByText('PO')).toHaveAttribute('aria-hidden', 'true')
  })

  it('moves the active option with arrows and selects it with Enter', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <PlayerSearchForm
        getSuggestions={async () => [result(), result({ accountId: 456, displayName: 'Pocket' })]}
        initialQuery=""
        onSelect={onSelect}
      />,
    )

    const input = screen.getByRole('combobox', { name: 'Steam name or ID' })
    await user.type(input, 'P')
    const options = await screen.findAllByRole('option')
    await user.keyboard('{ArrowDown}{ArrowDown}')

    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    expect(input).toHaveAttribute('aria-activedescendant', options[1].id)
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(result({ accountId: 456, displayName: 'Pocket' }))
  })

  it('does not select or submit while text is being composed', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <PlayerSearchForm
        getSuggestions={async () => [result()]}
        initialQuery=""
        onSelect={onSelect}
      />,
    )

    const input = screen.getByRole('combobox', { name: 'Steam name or ID' })
    await user.type(input, 'Iv')
    await screen.findByRole('option', { name: 'Ivy' })
    await user.keyboard('{ArrowDown}')
    fireEvent.compositionStart(input)
    fireEvent.keyDown(input, { isComposing: true, key: 'Enter' })

    expect(input).toHaveValue('Iv')
    expect(onSelect).not.toHaveBeenCalled()

    fireEvent.compositionEnd(input)
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 })
    expect(input).toHaveValue('Iv')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('supports Home End and Escape', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <PlayerSearchForm
        getSuggestions={async () => [result(), result({ accountId: 456, displayName: 'Pocket' })]}
        initialQuery=""
        onSelect={onSelect}
      />,
    )

    const input = screen.getByRole('combobox', { name: 'Steam name or ID' })
    await user.type(input, 'P')
    const options = await screen.findAllByRole('option')
    await user.keyboard('{End}')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Home}')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(input).not.toHaveAttribute('aria-activedescendant')
    await user.keyboard('{Enter}')
    expect(onSelect).not.toHaveBeenCalled()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('listbox')).toBeVisible()
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('closes suggestions when focus leaves the combobox', async () => {
    const user = userEvent.setup()
    render(
      <PlayerSearchForm
        getSuggestions={async () => [result()]}
        initialQuery=""
        onSelect={() => undefined}
      />,
    )

    const input = screen.getByRole('combobox', { name: 'Steam name or ID' })
    await user.type(input, 'Iv')
    await screen.findByRole('option', { name: 'Ivy' })
    await user.tab()

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('keeps pointer selection when the input blurs', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <PlayerSearchForm
        getSuggestions={async () => [result()]}
        initialQuery=""
        onSelect={onSelect}
      />,
    )

    const input = screen.getByRole('combobox', { name: 'Steam name or ID' })
    await user.type(input, 'Iv')
    const option = await screen.findByRole('option', { name: 'Ivy' })
    fireEvent.pointerDown(option)
    fireEvent.blur(input)
    fireEvent.click(option)

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(result())
  })

  it('does not select typed text after suggestion loading fails', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <PlayerSearchForm
        getSuggestions={async () => {
          throw new Error('offline')
        }}
        initialQuery=""
        onSelect={onSelect}
      />,
    )

    const input = screen.getByRole('combobox', { name: 'Steam name or ID' })
    await user.type(input, 'Ivy')
    expect(screen.getByRole('status')).toHaveTextContent('Searching players')
    await screen.findByText('Suggestions unavailable. You can still search.')
    await user.keyboard('{Enter}')

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('announces when no suggestions match', async () => {
    const user = userEvent.setup()
    render(
      <PlayerSearchForm
        getSuggestions={async () => []}
        initialQuery=""
        onSelect={() => undefined}
      />,
    )

    await user.type(screen.getByRole('combobox', { name: 'Steam name or ID' }), 'Nobody')
    await screen.findByText('No player suggestions.')
    expect(screen.getByRole('status')).toHaveTextContent('No player suggestions.')
  })
})

describe('SearchResults', () => {
  it('renders a useful empty state before a search', async () => {
    await renderResults(<SearchResults query="" results={[]} />)
    expect(screen.getByText('Search by Steam name or ID to begin.')).toBeVisible()
  })

  it('announces the result count and provides an intentional avatar fallback', async () => {
    await renderResults(
      <SearchResults
        query="ivy"
        results={[result(), result({ accountId: 456, displayName: 'Pocket' })]}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('2 players found')
    expect(screen.getByText('IV')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('link', { name: /view ivy/i })).toHaveAttribute(
      'href',
      '/players/123',
    )
  })

  it('shows a provider error without exposing technical details', async () => {
    await renderResults(
      <SearchResults
        error="Deadlock is busy. Please try again later."
        query="ivy"
        results={[]}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Deadlock is busy. Please try again later.',
    )
  })
})

async function renderResults(element: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => element })
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/' })
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  render(<RouterProvider router={router} />)
  await router.load()
}

function result(overrides: Partial<PlayerSearchResult> = {}): PlayerSearchResult {
  return {
    accountId: 123,
    displayName: 'Ivy',
    avatarUrl: null,
    profileUrl: 'https://steamcommunity.com/profiles/123',
    ...overrides,
  }
}
