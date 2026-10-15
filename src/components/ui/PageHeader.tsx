import React, { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  gradient?: 'orange' | 'red' | 'purple';
  icon?: ReactNode;
  tag?: string;
}

export function PageHeader({
  title,
  subtitle,
  action,
  gradient = 'orange',
  icon,
  tag,
}: PageHeaderProps) {
  const gradientClass =
    gradient === 'red'
      ? 'text-gradient-red'
      : gradient === 'purple'
      ? 'text-gradient-purple'
      : 'text-gradient-orange';

  const glowBorderClass =
    gradient === 'red'
      ? 'border-red-500/20 shadow-[0_1px_15px_-3px_rgba(239,68,68,0.2)]'
      : gradient === 'purple'
      ? 'border-purple-500/20 shadow-[0_1px_15px_-3px_rgba(168,85,247,0.2)]'
      : 'border-orange-500/20 shadow-[0_1px_15px_-3px_rgba(249,115,22,0.2)]';

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn('pb-4 mb-4 border-b transition-all', glowBorderClass)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          {tag && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/15">
                {tag}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            {icon && <div className="shrink-0">{icon}</div>}
            <h1
              className={cn(
                'text-2xl sm:text-3xl font-extrabold tracking-tight font-["Teko",sans-serif] text-3xl sm:text-4xl leading-none',
                gradientClass
              )}
            >
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5 max-w-2xl font-medium">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
      </div>
    </motion.div>
  );
}
