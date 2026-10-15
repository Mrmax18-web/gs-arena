import React from 'react';
import { cn } from '../../lib/cn';

export interface TagChipProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'danger' | 'warn' | 'muted';
  className?: string;
}

/**
 * Micro tag chip primitive inspired by Broadcast Noir / Reference-B style (BASIC/PRO/EXPERT tags).
 * 10-11px monospace uppercase with 4px border radius and 0.14em letter-spacing.
 */
export function TagChip({
  children,
  variant = 'default',
  className,
}: TagChipProps) {
  const variantStyles = {
    default: 'border-border bg-surface-2/60 text-muted',
    accent: 'border-accent/40 bg-accent/10 text-accent font-semibold',
    success: 'border-success/40 bg-success/10 text-success font-semibold',
    danger: 'border-danger/40 bg-danger/10 text-danger font-semibold',
    warn: 'border-warn/40 bg-warn/10 text-warn font-semibold',
    muted: 'border-border/50 bg-surface/40 text-muted/80',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] border text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.14em] leading-tight select-none backdrop-blur-sm transition-colors',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
