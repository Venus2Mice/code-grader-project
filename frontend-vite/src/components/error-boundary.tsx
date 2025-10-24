import React, { type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary Component
 * Catches React errors and displays a user-friendly fallback UI
 * Prevents entire app from crashing
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console and logger
    logger.error('ErrorBoundary caught error', error, {
      componentStack: errorInfo.componentStack,
      errorMessage: error.message,
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    // Optionally reload the page
    window.location.reload()
  }

  handleHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="max-w-md w-full">
              {/* Error Card */}
              <div className="border-4 border-destructive bg-destructive/5 p-8 rounded-none">
                {/* Error Icon */}
                <div className="mb-6 flex justify-center">
                  <div className="h-16 w-16 bg-destructive border-4 border-destructive flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-destructive-foreground" />
                  </div>
                </div>

                {/* Error Message */}
                <h1 className="text-3xl font-black uppercase text-center mb-4">
                  Oops! Something Went Wrong
                </h1>

                <p className="text-center text-foreground/80 mb-6 font-semibold">
                  An unexpected error occurred. The error has been logged and our team will investigate.
                </p>

                {/* Error Details (Development Only) */}
                {import.meta.env.DEV && this.state.error && (
                  <div className="mb-6 p-4 bg-muted border-2 border-border rounded-none overflow-auto max-h-48">
                    <p className="text-xs font-mono text-destructive mb-2">
                      <strong>Error:</strong>
                    </p>
                    <p className="text-xs font-mono text-foreground/70 break-words">
                      {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <>
                        <p className="text-xs font-mono text-destructive mt-3 mb-2">
                          <strong>Stack:</strong>
                        </p>
                        <pre className="text-xs font-mono text-foreground/70 whitespace-pre-wrap break-words">
                          {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                        </pre>
                      </>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={this.handleReset}
                    className="w-full gap-2 font-black uppercase"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>

                  <Button
                    onClick={this.handleHome}
                    variant="outline"
                    className="w-full gap-2 font-black uppercase bg-transparent"
                  >
                    <Home className="h-4 w-4" />
                    Back to Home
                  </Button>
                </div>

                {/* Help Text */}
                <p className="text-center text-xs text-muted-foreground mt-6">
                  If the problem persists, please contact support or try again later.
                </p>
              </div>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
