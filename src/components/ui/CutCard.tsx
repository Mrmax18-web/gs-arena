import React from 'react';
import { cn } from '../../lib/cn';

export interface CutCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  cutPosition?: 'tl' | 'br' | 'diagonal' | 'all';
  edgeLight?: boolean;
}

/**
 * Esports CutCard featuring precision diagonal chamfered corners (10-14px clip-path).
 * Features an interactive neon edge-light glow on hover.
 */
export function CutCard({
  children,
  cutPosition = 'diagonal',
  edgeLight = true,
  className,
  ...props
}: CutCardProps) {
  const cutClasses = {
    tl: 'cut-corner-tl',
    br: 'cut-corner-br',
    diagonal: 'cut-corner-diagonal',
    all: 'cut-corner-all',
  };

  return (
    <div
      className={cn(
        'group relative border border-border bg-surface/75 backdrop-blur-xl transition-all duration-220 overflow-hidden',
        cutClasses[cutPosition],
        edgeLight && 'hover:border-accent/50 hover:shadow-[0_0_20px_var(--accent-glow)]',
        className
      )}
      {...props}
    >
      {/* Top subtle highlight rim */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {children}
    </div>
  );
}
