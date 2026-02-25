'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  module?: string
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  showDetails: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary]', this.props.module || 'Unknown', error, errorInfo)
    }
    // TODO: Send to error tracking service (e.g., Sentry)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
          <div className="max-w-md w-full">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
            </div>

            {/* Title & Description */}
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-t1 mb-2">Something went wrong</h2>
              <p className="text-sm text-t3">
                {this.props.module
                  ? `An error occurred in the ${this.props.module} module. This has been logged and our team will investigate.`
                  : 'An unexpected error occurred. Please try again or contact support if the problem persists.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2.5 bg-tempo-600 text-white text-sm font-medium rounded-lg hover:bg-tempo-700 transition-colors"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              <a
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border text-t1 text-sm font-medium rounded-lg hover:bg-canvas transition-colors"
              >
                <Home size={16} />
                Go to Dashboard
              </a>
            </div>

            {/* Error Details (collapsible) */}
            {this.state.error && (
              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
                  className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-canvas/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Bug size={14} className="text-t3" />
                    <span className="text-xs font-medium text-t2">Technical Details</span>
                  </div>
                  {this.state.showDetails
                    ? <ChevronUp size={14} className="text-t3" />
                    : <ChevronDown size={14} className="text-t3" />
                  }
                </button>
                {this.state.showDetails && (
                  <div className="px-4 py-3 border-t border-divider bg-canvas/30">
                    <p className="text-xs font-mono text-red-600 mb-2 break-all">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="text-[0.65rem] font-mono text-t3 overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack.trim().split('\n').slice(0, 8).join('\n')}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/** Lightweight inline error display for non-critical sections */
export function InlineError({
  message = 'Failed to load this section',
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
      <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
      <p className="text-xs text-red-700 flex-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  )
}
