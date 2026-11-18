import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppError, toPublicErrorState } from './AppError'
import { EmptyState } from './EmptyState'

describe('AppError', () => {
  it('maps known provider failures to safe retryable product language', () => {
    const state = toPublicErrorState({
      code: 'rate-limited',
      message: 'raw provider body',
      retryAfterSeconds: 7,
    })
    render(<AppError error={state} onRetry={() => undefined} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Deadlock is busy')
    expect(screen.getByText('Try again in 7 seconds.')).toBeVisible()
    expect(screen.queryByText('raw provider body')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible()
  })

  it('does not offer retry for a missing record', () => {
    render(<AppError error={toPublicErrorState({ code: 'not-found' })} onRetry={() => undefined} />)

    expect(screen.getByText('No matching Deadlock record was found.')).toBeVisible()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('runs retry and returns focus to the control', async () => {
    const retry = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<AppError error={toPublicErrorState({ code: 'timeout' })} onRetry={retry} />)

    const button = screen.getByRole('button', { name: 'Try again' })
    await user.click(button)
    expect(retry).toHaveBeenCalledOnce()
    expect(button).toHaveFocus()
  })
})

describe('EmptyState', () => {
  it('provides a labelled status message', () => {
    render(<EmptyState title="No matches" description="Try a broader filter." />)
    expect(screen.getByRole('status')).toHaveAccessibleName('No matches')
    expect(screen.getByText('Try a broader filter.')).toBeVisible()
  })
})
