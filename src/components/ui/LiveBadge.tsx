import React from 'react';
import { cn } from '../../lib/cn';

export interface LiveBadgeProps {
  label?: string;
  className?: string;
}

/**
 * Broadcast-style LiveBadge with a pulsing neon red indicator and monospace text.
 * Respects prefers-reduced-motion by disabling the scale/glow pulsation.
 */
export function LiveBadge({ label = 'LIVE', className }: LiveBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] border border-danger/40 bg-danger/10 text-danger font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] shadow-[0_0_12px_rgba(255,59,78,0.25)] select-none',
        className
      )}
      title="Live Broadcast Active"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75 motion-reduce:hidden" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-danger shadow-[0_0_6px_#FF3B4E]" />
      </span>
      <span>{label}</span>
    </span>
  );
}
