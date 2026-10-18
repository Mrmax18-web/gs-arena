import { Component, ErrorInfo, ReactNode } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Icon } from '@iconify/react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <GlassCard className="max-w-md w-full text-center border-rose-500/30 p-8 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
              <Icon icon="solar:shield-warning-bold" className="text-3xl" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {this.props.fallbackTitle || 'Something unexpected happened'}
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {this.state.error?.message || 'An unexpected rendering error occurred in this view.'}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="secondary" size="sm" onClick={this.handleReset}>
                Try Again
              </Button>
              <Button variant="primary" size="sm" onClick={this.handleReload}>
                Reload Application
              </Button>
            </div>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}
