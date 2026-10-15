import React from 'react';

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading analytics data">
      {/* Header skeleton */}
      <div className="pb-4 border-b border-white/10 space-y-2">
        <div className="h-5 w-24 bg-white/10 rounded-full" />
        <div className="h-9 w-64 bg-white/10 rounded-xl" />
        <div className="h-4 w-96 max-w-full bg-white/5 rounded-lg" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-28 bg-white/10 rounded-md" />
              <div className="h-6 w-6 rounded-lg bg-white/10" />
            </div>
            <div className="h-10 w-16 bg-white/20 rounded-xl" />
            <div className="h-3 w-36 bg-white/5 rounded-md" />
          </div>
        ))}
      </div>

      {/* Secondary content skeleton */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
        <div className="h-6 w-48 bg-white/10 rounded-lg" />
        <div className="h-4 w-full bg-white/5 rounded-lg" />
        <div className="h-4 w-3/4 bg-white/5 rounded-lg" />
      </div>
    </div>
  );
}
