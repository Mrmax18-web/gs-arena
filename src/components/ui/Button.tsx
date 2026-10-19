import React from 'react';
import { Icon } from '@iconify/react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      icon,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 min-h-[36px] gap-1.5',
      md: 'text-sm px-4 py-2.5 min-h-[44px] gap-2',
      lg: 'text-base px-6 py-3 min-h-[48px] gap-2.5',
    };

    const variantStyles = {
      primary:
        'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-600/25 border border-red-500/30',
      secondary:
        'bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white border border-black/5 dark:border-white/10',
      danger:
        'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 border border-rose-400/30',
      ghost:
        'bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200',
      glass:
        'glass hover:bg-white/80 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-black/10 dark:border-white/15 shadow-sm',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {loading ? (
          <Icon icon="solar:refresh-circle-bold" className="animate-spin text-lg" />
        ) : icon ? (
          <Icon icon={icon} className="text-lg shrink-0" />
        ) : null}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
