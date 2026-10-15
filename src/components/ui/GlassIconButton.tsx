import React from 'react';
import { cn } from '../../lib/cn';

export interface GlassIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'accent' | 'danger';
}

/**
 * Circular glass icon button with hairline border and inner highlight (Reference-B).
 * Supports 40px and 48px standard touch targets with strict accessibility labels.
 */
export function GlassIconButton({
  children,
  size = 'md',
  variant = 'default',
  className,
  disabled,
  ...props
}: GlassIconButtonProps) {
  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm', // 40px
    lg: 'w-12 h-12 text-base', // 48px
  };

  const variantStyles = {
    default:
      'border-border bg-surface/60 text-muted hover:text-foreground hover:border-border/80 hover:bg-surface-2/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
    accent:
      'border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 hover:border-accent shadow-[0_0_12px_var(--accent-glow)]',
    danger:
      'border-danger/40 bg-danger/10 text-danger hover:bg-danger/20 hover:border-danger shadow-[0_0_12px_rgba(255,59,78,0.25)]',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full border backdrop-blur-xl transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
