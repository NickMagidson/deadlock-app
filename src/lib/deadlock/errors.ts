export type DeadlockApiErrorCode =
  | 'invalid-response'
  | 'not-found'
  | 'rate-limited'
  | 'timeout'
  | 'unavailable'
  | 'unknown'

interface DeadlockApiErrorOptions {
  code: DeadlockApiErrorCode
  message: string
  status?: number
  retryAfterSeconds?: number
  cause?: unknown
}

export class DeadlockApiError extends Error {
  readonly code: DeadlockApiErrorCode
  readonly status?: number
  readonly retryAfterSeconds?: number

  constructor(options: DeadlockApiErrorOptions) {
    super(options.message, { cause: options.cause })
    this.name = 'DeadlockApiError'
    this.code = options.code
    this.status = options.status
    this.retryAfterSeconds = options.retryAfterSeconds
  }
}
