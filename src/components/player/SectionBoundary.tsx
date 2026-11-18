import { Component, type ErrorInfo, type ReactNode } from 'react'

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
        <section className="section-error" role="alert">
          <p>{this.props.name} could not be loaded.</p>
          <button
            disabled={this.state.retrying}
            onClick={() => void this.retry()}
            type="button"
          >
            {this.state.retrying ? 'Retrying…' : `Retry ${this.props.name.toLowerCase()}`}
          </button>
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

export function SectionSkeleton({ label }: { label: string }) {
  return (
    <section aria-hidden="true" className="section-skeleton" title={label}>
      <span />
      <span />
      <span />
    </section>
  )
}
