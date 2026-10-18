import React from 'react';
import { Icon } from '@iconify/react';
import { GlassCard } from './GlassCard';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description = 'Failed to load tournament data. Please check your network connection or try again.',
  onRetry,
  className = '',
}) => {
  return (
    <GlassCard className={`flex flex-col items-center justify-center py-12 px-6 text-center border-rose-500/20 ${className}`}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
        <Icon icon="solar:shield-warning-bold" className="text-3xl" />
      </div>
      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h4>
      <p className="mt-1.5 max-w-sm text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
      {onRetry && (
        <div className="mt-5">
          <Button variant="secondary" size="sm" icon="solar:refresh-bold" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
    </GlassCard>
  );
};
