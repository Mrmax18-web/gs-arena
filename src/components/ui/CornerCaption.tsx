import React from 'react';
import { cn } from '../../lib/cn';

export type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface CornerCaptionProps {
  children: React.ReactNode;
  position?: CornerPosition;
  fixed?: boolean;
  className?: string;
}

/**
 * Pinned micro-caption element inspired by Reference-B corner notes
 * ("Navigation vers les autres pages" style, season stamps, build indicators).
 */
export function CornerCaption({
  children,
  position = 'top-right',
  fixed = false,
  className,
}: CornerCaptionProps) {
  const positionStyles: Record<CornerPosition, string> = {
    'top-left': 'top-3 left-4',
    'top-right': 'top-3 right-4',
    'bottom-left': 'bottom-3 left-4',
    'bottom-right': 'bottom-3 right-4',
  };

  return (
    <div
      className={cn(
        fixed ? 'fixed z-20' : 'absolute',
        positionStyles[position],
        'pointer-events-none select-none font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-muted/60 flex items-center gap-1.5 backdrop-blur-sm px-2 py-0.5 rounded border border-border/40 bg-surface/30',
        className
      )}
    >
      {children}
    </div>
  );
}
