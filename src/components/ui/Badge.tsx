import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type BadgeVariant = 'orange' | 'red' | 'green' | 'amber' | 'cyan' | 'purple' | 'grey';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<BadgeVariant, { container: string; dot: string }> = {
  orange: {
    container: 'bg-bgmi-primary/15 text-bgmi-primary border-bgmi-primary/40 shadow-[0_0_12px_rgba(255,107,53,0.2)]',
    dot: 'bg-bgmi-primary',
  },
  red: {
    container: 'bg-accent-red/15 text-accent-red border-accent-red/40 shadow-[0_0_12px_rgba(239,68,68,0.2)]',
    dot: 'bg-accent-red',
  },
  green: {
    container: 'bg-accent-green/15 text-accent-green border-accent-green/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
    dot: 'bg-accent-green',
  },
  amber: {
    container: 'bg-accent-amber/15 text-accent-amber border-accent-amber/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
    dot: 'bg-accent-amber',
  },
  cyan: {
    container: 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40 shadow-[0_0_12px_rgba(0,217,255,0.2)]',
    dot: 'bg-accent-cyan',
  },
  purple: {
    container: 'bg-accent-purple/15 text-accent-purple border-accent-purple/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]',
    dot: 'bg-accent-purple',
  },
  grey: {
    container: 'bg-white/10 text-slate-300 border-white/20',
    dot: 'bg-slate-400',
  },
};

const SIZES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

/**
 * Esports status badge with neon color accents, glowing borders,
 * JetBrains Mono typography, and optional pulse dot.
 */
export function Badge({
  variant = 'cyan',
  size = 'md',
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  const currentVariant = VARIANTS[variant] || VARIANTS.cyan;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-mono font-medium uppercase tracking-wider select-none backdrop-blur-md',
        currentVariant.container,
        SIZES[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              currentVariant.dot,
            )}
          />
          <span
            className={cn('relative inline-flex h-2 w-2 rounded-full', currentVariant.dot)}
          />
        </span>
      )}
      {children}
    </span>
  );
}
