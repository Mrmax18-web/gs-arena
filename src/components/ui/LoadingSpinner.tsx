import React from 'react';
import { Icon } from '@iconify/react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label = 'Loading...',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  };

  return (
    <div
      className={`min-h-[40vh] flex flex-col items-center justify-center gap-3 p-6 text-slate-400 dark:text-slate-300 ${className}`}
      role="status"
      aria-live="polite"
    >
      <Icon
        icon="solar:spinner-bold"
        className={`animate-spin text-brand-500 ${sizeClasses[size]}`}
      />
      {label && <p className="text-xs font-medium tracking-wide animate-pulse">{label}</p>}
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default LoadingSpinner;
