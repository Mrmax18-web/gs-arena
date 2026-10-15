import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'text' | 'card' | 'circle' | 'chart';
}

/**
 * Shimmering skeleton placeholder for loading data tables, cards, and text metrics.
 * Built with semantic design tokens for Broadcast Noir light & dark theme fidelity.
 */
export function Skeleton({ className, variant = 'text', ...props }: SkeletonProps) {
  if (variant === 'circle') {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-full w-10 h-10 bg-surface-2/70 border border-border/40 shrink-0',
          'before:absolute before:inset-0 before:-translate-x-full',
          'before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r',
          'before:from-transparent before:via-foreground/[0.06] before:to-transparent',
          className
        )}
        {...props}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'relative overflow-hidden p-5 rounded-[18px] bg-surface/70 border border-border space-y-3',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-2" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-1/3 bg-surface-2 rounded" />
            <div className="h-3 w-1/4 bg-surface-2/60 rounded" />
          </div>
        </div>
        <div className="h-10 bg-surface-2/40 rounded-xl" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-surface-2/70 border border-border/40',
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r',
        'before:from-transparent before:via-foreground/[0.06] before:to-transparent',
        className
      )}
      {...props}
    />
  );
}
