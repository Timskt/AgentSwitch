import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center bg-rose-950/20 border border-rose-800/40 rounded-xl m-4 text-rose-200">
          <AlertTriangle className="w-8 h-8 text-rose-400 mb-2" />
          <h3 className="text-sm font-semibold mb-1">
            {this.props.fallbackTitle || '组件渲染遇到临时异常 (Component Render Error)'}
          </h3>
          <p className="text-xs text-rose-300/80 font-mono mb-3 max-w-md break-all">
            {this.state.error?.message || 'Unknown render error'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>重置恢复 (Reset)</span>
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
