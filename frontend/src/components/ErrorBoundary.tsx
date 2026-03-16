import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
          <div className="text-center p-8 bg-white rounded-lg border border-red-200 shadow max-w-md">
            <p className="text-red-600 font-medium">Algo deu errado</p>
            <p className="text-sm text-slate-500 mt-1 font-mono break-all">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Recarregar página
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
