import React, { type ReactNode } from 'react';
import { AnimatedCounter } from './ui/AnimatedCounter';
import { cn } from '../lib/cn';

export interface StatCardProps {
  icon: ReactNode | string;
  label: string;
  value: number;
  loading?: boolean;
  accent?: string;
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  loading = false,
  accent = '#FF6B35',
  className,
}: StatCardProps) {
  return (
    <div
      style={{
        boxShadow: `0 0 15px -3px ${accent}25`,
        borderColor: `${accent}40`,
      }}
      className={cn(
        'h-20 px-4 py-2.5 rounded-xl glass-card border flex items-center justify-between transition-all duration-200',
        'hover:border-white/30 hover:scale-[1.01]',
        className
      )}
    >
      <div className="flex flex-col justify-center min-w-0">
        <span className="text-xs uppercase font-bold tracking-wider text-slate-300 truncate">
          {label}
        </span>
        {loading ? (
          <div className="h-6 w-12 mt-1 rounded bg-white/10 animate-pulse" />
        ) : (
          <div className="text-xl sm:text-2xl font-black font-mono text-white leading-tight mt-0.5">
            <AnimatedCounter value={value ?? 0} />
          </div>
        )}
      </div>

      <div
        style={{
          backgroundColor: `${accent}18`,
          color: accent,
          borderColor: `${accent}30`,
        }}
        className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 text-base sm:text-lg select-none"
      >
        {typeof icon === 'string' ? (
          <span role="img" aria-label={label}>
            {icon}
          </span>
        ) : (
          icon
        )}
      </div>
    </div>
  );
}
