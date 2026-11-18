import { useEffect, useRef, useState } from 'react'

export type PublicErrorCode =
  | 'invalid-input'
  | 'invalid-response'
  | 'not-found'
  | 'rate-limited'
  | 'timeout'
  | 'unavailable'
  | 'unknown'

export interface PublicErrorState {
  code: PublicErrorCode
  message: string
  retryable: boolean
  retryAfterSeconds?: number
}

interface AppErrorProps {
  error: unknown
  onRetry?: () => void | Promise<void>
}

export function AppError({ error, onRetry }: AppErrorProps) {
  const state = isPublicErrorState(error) ? error : toPublicErrorState(error)
  const [retrying, setRetrying] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const retryRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  async function retry() {
    if (!onRetry || retrying) return
    setRetrying(true)
    try {
      await onRetry()
    } finally {
      setRetrying(false)
      requestAnimationFrame(() => retryRef.current?.focus())
    }
  }

  return (
    <section className="app-error" role="alert">
      <h2>Request interrupted</h2>
      <p>{state.message}</p>
      {state.retryAfterSeconds !== undefined ? (
        <p>Try again in {state.retryAfterSeconds} seconds.</p>
      ) : null}
      {state.retryable && onRetry && isHydrated ? (
        <button
          disabled={retrying}
          onClick={() => void retry()}
          ref={retryRef}
          type="button"
        >
          {retrying ? 'Trying again…' : 'Try again'}
        </button>
      ) : null}
    </section>
  )
}

export function toPublicErrorState(error: unknown): PublicErrorState {
  const code = errorCode(error)
  const retryAfterSeconds = retryDelay(error)
  const originalMessage = errorMessage(error)

  if (code === 'not-found') {
    return { code, message: 'No matching Deadlock record was found.', retryable: false }
  }
  if (code === 'invalid-input') {
    return { code, message: 'That request was not valid.', retryable: false }
  }
  if (code === 'rate-limited') {
    return {
      code,
      message: 'Deadlock is busy. Please try again later.',
      retryable: true,
      ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
    }
  }
  if (code === 'timeout' || code === 'unavailable') {
    return {
      code,
      message: 'Deadlock is temporarily unavailable.',
      retryable: true,
      ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
    }
  }
  if (code === 'invalid-response') {
    return {
      code,
      message: 'The player archive returned an unexpected response.',
      retryable: true,
    }
  }
  if (originalMessage === 'Deadlock could not be reached.') {
    return { code: 'unknown', message: originalMessage, retryable: true }
  }
  if (originalMessage === 'Deadlock is busy. Please try again later.') {
    return {
      code: 'rate-limited',
      message: 'Deadlock is busy. Please try again later.',
      retryable: true,
    }
  }
  return {
    code: 'unknown',
    message: 'The player archive could not complete this request.',
    retryable: true,
  }
}

function errorCode(error: unknown): PublicErrorCode {
  if (typeof error === 'object' && error && 'code' in error) {
    const code = String(error.code)
    if (
      code === 'invalid-input' ||
      code === 'invalid-response' ||
      code === 'not-found' ||
      code === 'rate-limited' ||
      code === 'timeout' ||
      code === 'unavailable'
    ) return code
  }
  return 'unknown'
}

function retryDelay(error: unknown) {
  if (typeof error !== 'object' || !error || !('retryAfterSeconds' in error)) return undefined
  const value = Number(error.retryAfterSeconds)
  return Number.isFinite(value) && value >= 0 ? Math.ceil(value) : undefined
}

function errorMessage(error: unknown) {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error && 'message' in error) return String(error.message)
  return ''
}

function isPublicErrorState(error: unknown): error is PublicErrorState {
  return Boolean(
    typeof error === 'object' && error && 'code' in error && 'message' in error && 'retryable' in error,
  )
}
