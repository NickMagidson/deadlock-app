import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AppError } from '../system/AppError'

interface SectionBoundaryProps {
  children: ReactNode
  name: string
  onRetry: () => void | Promise<void>
  resetKey?: unknown
}

interface SectionBoundaryState {
  error: Error | null
  retrying: boolean
}

export class SectionBoundary extends Component<SectionBoundaryProps, SectionBoundaryState> {
  state: SectionBoundaryState = { error: null, retrying: false }

  static getDerivedStateFromError(error: Error): SectionBoundaryState {
    return { error, retrying: false }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {}

  componentDidUpdate(previous: SectionBoundaryProps) {
    if (previous.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null, retrying: false })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <section className="section-error">
          <AppError
            error={sectionError(this.state.error, this.props.name)}
            onRetry={() => this.retry()}
            retryLabel={`Retry ${this.props.name.toLowerCase()}`}
          />
        </section>
      )
    }
    return this.props.children
  }

  private async retry() {
    this.setState({ retrying: true })
    await this.props.onRetry()
    this.setState({ error: null, retrying: false })
  }
}

function sectionError(error: Error, name: string) {
  const retryAfterSeconds =
    'retryAfterSeconds' in error && Number.isFinite(Number(error.retryAfterSeconds))
      ? Number(error.retryAfterSeconds)
      : undefined
  return {
    code: 'unknown' as const,
    message: `${name} could not be loaded.`,
    retryable: true,
    ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
  }
}

export function SectionSkeleton({ label }: { label: string }) {
  return (
    <section aria-hidden="true" className="section-skeleton" title={label}>
      <span />
      <span />
      <span />
    </section>
  )
}
