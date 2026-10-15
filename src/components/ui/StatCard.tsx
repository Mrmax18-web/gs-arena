import React from 'react';
import { cn } from '../../lib/cn';
import { TagChip } from './TagChip';

export interface StatCardProps {
  label: string;
  value: string | number;
  delta?: {
    value: string | number;
    type: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  sparkline?: React.ReactNode;
  variant?: 'default' | 'hero';
  tag?: string;
  loading?: boolean;
  className?: string;
}

/**
 * Broadcast-grade StatCard presenting esports telemetry.
 * Features monospace numerals, hairline borders, delta indicators,
 * and an elevated hero variant with a soft vertical gradient wash (Reference-B).
 */
export function StatCard({
  label,
  value,
  delta,
  icon,
  sparkline,
  variant = 'default',
  tag,
  loading = false,
  className,
}: StatCardProps) {
  const isHero = variant === 'hero';

  return (
    <div
      className={cn(
        'relative flex flex-col justify-between p-4 sm:p-5 rounded-[18px] border transition-all duration-220 overflow-hidden',
        isHero
          ? 'border-accent/30 bg-gradient-to-b from-accent/10 via-surface to-surface-2 shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] -translate-y-1'
          : 'border-border bg-surface/70 hover:border-border/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        className
      )}
    >
      {/* Top row: Label & Tag / Icon */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted truncate">
            {label}
          </span>
          {tag && <TagChip variant={isHero ? 'accent' : 'default'}>{tag}</TagChip>}
        </div>
        {icon && (
          <div className="shrink-0 text-muted/70 group-hover:text-accent transition-colors">
            {icon}
          </div>
        )}
      </div>

      {/* Main value & delta */}
      <div className="flex items-baseline justify-between gap-3 mt-1">
        {loading ? (
          <div className="h-8 w-24 rounded bg-surface-2 animate-pulse" />
        ) : (
          <div className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </div>
        )}

        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-1 font-mono text-[11px] font-semibold tracking-wider select-none',
              delta.type === 'up' && 'text-success',
              delta.type === 'down' && 'text-danger',
              delta.type === 'neutral' && 'text-muted'
            )}
          >
            {delta.type === 'up' && '▲'}
            {delta.type === 'down' && '▼'}
            {delta.type === 'neutral' && '•'}
            {delta.value}
          </span>
        )}
      </div>

      {/* Sparkline or extra slot */}
      {sparkline && <div className="mt-3 pt-2 border-t border-border/50">{sparkline}</div>}
    </div>
  );
}
