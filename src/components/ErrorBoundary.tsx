import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, Home, ChevronDown, ChevronUp } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  fallback?: ReactNode | ((error: Error | null, reset: () => void) => ReactNode);
  isGlobal?: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
  isRetrying: boolean;
  retryCount: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    isRetrying: false,
    retryCount: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Global ErrorBoundary Caught Error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ isRetrying: true });
    // Small timeout ensures visual feedback and clears any pending microtask glitches
    setTimeout(() => {
      this.setState((prev) => ({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false,
        retryCount: prev.retryCount + 1,
      }));
      this.props.onReset?.();
    }, 150);
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    const { hasError, error, errorInfo, showDetails, isRetrying, retryCount } = this.state;
    const { children, fallbackTitle, fallbackMessage, fallback, isGlobal } = this.props;

    if (!hasError) {
      return children;
    }

    if (typeof fallback === 'function') {
      return fallback(error, this.handleReset);
    }

    if (fallback) {
      return fallback;
    }

    const errorMsg = error?.message || 'Unknown rendering error';
    const isDataFetchingIssue = Boolean(
      errorMsg.toLowerCase().includes('fetch') ||
      errorMsg.toLowerCase().includes('network') ||
      errorMsg.toLowerCase().includes('firestore') ||
      errorMsg.toLowerCase().includes('timeout') ||
      errorMsg.toLowerCase().includes('offline') ||
      errorMsg.toLowerCase().includes('failed to load') ||
      errorMsg.toLowerCase().includes('undefined') ||
      errorMsg.toLowerCase().includes('null') ||
      error?.name === 'FirebaseError'
    );

    const title = fallbackTitle || (
      isDataFetchingIssue
        ? 'Data Fetching & Rendering Notice'
        : 'Something Went Wrong'
    );

    const description = fallbackMessage || (
      isDataFetchingIssue
        ? 'A problem occurred while retrieving or displaying live tournament data. This may be due to a temporary network interruption or delayed server response. Tap "Try Again" below to re-fetch and render.'
        : 'An unexpected component failure occurred. You can attempt to re-render using the "Try Again" button below or refresh the page.'
    );

    return (
      <div
        className={`flex items-center justify-center p-4 sm:p-6 ${
          isGlobal ? 'min-h-screen bg-slate-950 text-slate-100' : 'min-h-[380px] w-full'
        }`}
      >
        <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-amber-500/30 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Subtle esports accent ambient glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-orange-600/10 blur-3xl" />

          {/* Icon Header */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 shadow-inner">
              <AlertTriangle className="h-7 w-7 animate-pulse text-amber-400" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-white font-['Teko',sans-serif]">
              {title}
            </h2>

            <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-md">
              {description}
            </p>

            {retryCount > 0 && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-xs font-medium text-amber-300 border border-amber-500/20">
                <RotateCcw className="h-3 w-3" /> Retry attempt #{retryCount}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              disabled={isRetrying}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-amber-400 hover:to-orange-500 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors active:scale-95 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4 text-slate-400" />
              Reload Page
            </button>

            <button
              type="button"
              onClick={() => { window.location.href = '/'; }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors active:scale-95 cursor-pointer"
              title="Return to Home"
            >
              <Home className="h-4 w-4 text-slate-400" />
              Home
            </button>
          </div>

          {/* Technical Details Accordion */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={this.toggleDetails}
              className="flex w-full items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
            >
              <span>{showDetails ? 'Hide technical details' : 'Show technical details'}</span>
              {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showDetails && (
              <div className="mt-2.5 rounded-lg bg-black/60 p-3 text-left font-mono text-[11px] text-red-300/90 overflow-x-auto border border-red-500/20 max-h-48 scrollbar-thin">
                <p className="font-semibold text-red-400 break-words">{errorMsg}</p>
                {error?.stack && (
                  <pre className="mt-2 text-[10px] text-slate-400 whitespace-pre-wrap break-all leading-tight">
                    {error.stack}
                  </pre>
                )}
                {errorInfo?.componentStack && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Component Stack:</span>
                    <pre className="text-[10px] text-slate-400 whitespace-pre-wrap leading-tight">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
