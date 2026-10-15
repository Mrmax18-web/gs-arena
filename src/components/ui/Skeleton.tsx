import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'text' | 'card' | 'circle' | 'chart';
}

/**
 * Shimmering skeleton placeholder for loading data tables, cards, and text metrics.
 */
export function Skeleton({ className, variant = 'text', ...props }: SkeletonProps) {
  if (variant === 'circle') {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-full w-10 h-10 bg-white/[0.06] shrink-0',
          'before:absolute before:inset-0 before:-translate-x-full',
          'before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r',
          'before:from-transparent before:via-white/[0.1] before:to-transparent',
          className,
        )}
        {...props}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'relative overflow-hidden p-5 rounded-2xl bg-white/[0.06] border border-white/5 space-y-3',
          className,
        )}
        {...props}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-1/3 bg-white/10 rounded" />
            <div className="h-3 w-1/4 bg-white/5 rounded" />
          </div>
        </div>
        <div className="h-10 bg-white/5 rounded-xl" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-white/[0.06]',
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r',
        'before:from-transparent before:via-white/[0.1] before:to-transparent',
        className,
      )}
      {...props}
    />
  );
}
