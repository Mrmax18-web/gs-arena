import React from 'react';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
  interactive?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, strong = false, interactive = false, className = '', ...props }, ref) => {
    const baseClass = strong ? 'glass-strong' : 'glass';
    const interactiveClass = interactive
      ? 'glass-card cursor-pointer hover:-translate-y-1 hover:border-brand-500/50'
      : '';

    return (
      <div
        ref={ref}
        className={`rounded-2xl p-6 transition-all duration-300 ${baseClass} ${interactiveClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
