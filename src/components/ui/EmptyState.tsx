import React from 'react';
import { Icon } from '@iconify/react';
import { GlassCard } from './GlassCard';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'solar:inbox-line-bold',
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <GlassCard className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 dark:text-brand-400">
        <Icon icon={icon} className="text-3xl" />
      </div>
      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h4>
      {description && (
        <p className="mt-1.5 max-w-sm text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </GlassCard>
  );
};
