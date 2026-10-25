/**
 * ErrorBoundary.tsx — top-level React Error Boundary (spec § 12)
 *
 * Guarantees zero crashes: catches rendering errors, displays a non-technical
 * user-friendly message, and provides a safe recovery button that resets state.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Silent console log for debugging, zero network reports to adhere to CSP
    console.error('FormFit caught an unexpected render error:', error, errorInfo)
  }

  private handleReset = () => {
    try {
      this.setState({ hasError: false, error: undefined })
      window.location.reload()
    } catch {
      window.location.href = '/'
    }
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
          <div
            className="max-w-md w-full p-6 rounded-2xl shadow-xl text-center space-y-4"
            style={{
              background: 'var(--color-surface, #ffffff)',
              border: '1px solid var(--color-border, #e2e8f0)',
            }}
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
              <AlertCircle size={24} />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text, #0f172a)' }}>
                Something went wrong
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Something went wrong, your files are safe — click to reset
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={this.handleReset}
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm"
              >
                <RotateCcw size={15} />
                Click to reset
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
