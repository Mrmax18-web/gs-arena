import React from 'react';
import { cn } from '../../lib/cn';

export interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

export function SkeletonCard({ className, lines = 3 }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'p-5 rounded-2xl bg-black/40 border border-white/10 animate-pulse space-y-3',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="h-4 bg-white/10 rounded w-1/3" />
        <div className="h-4 bg-white/10 rounded-full w-12" />
      </div>
      <div className="h-7 bg-white/10 rounded w-1/2" />
      {Array.from({ length: lines - 2 }).map((_, i) => (
        <div key={i} className="h-3 bg-white/10 rounded w-full" />
      ))}
    </div>
  );
}
