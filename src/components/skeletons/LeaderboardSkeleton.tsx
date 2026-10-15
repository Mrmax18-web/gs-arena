import React from 'react';

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-3">
        <div className="h-4 bg-white/10 rounded w-24" />
        <div className="h-8 bg-white/10 rounded w-64" />
        <div className="h-4 bg-white/10 rounded w-96 max-w-full" />
      </div>

      {/* Podium Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-6">
        <div className="h-56 rounded-2xl bg-white/[0.03] border border-white/10 p-5 flex flex-col justify-end space-y-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 mx-auto" />
          <div className="h-5 bg-white/10 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-white/10 rounded w-1/2 mx-auto" />
        </div>
        <div className="h-72 rounded-2xl bg-white/[0.05] border border-amber-500/20 p-5 flex flex-col justify-end space-y-3 shadow-lg">
          <div className="w-16 h-16 rounded-xl bg-amber-500/20 mx-auto" />
          <div className="h-6 bg-amber-500/20 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-white/10 rounded w-1/2 mx-auto" />
        </div>
        <div className="h-52 rounded-2xl bg-white/[0.03] border border-white/10 p-5 flex flex-col justify-end space-y-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 mx-auto" />
          <div className="h-5 bg-white/10 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-white/10 rounded w-1/2 mx-auto" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
        <div className="h-10 bg-white/5 rounded-xl w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-white/[0.02] border border-white/5 rounded-xl w-full flex items-center px-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-white/10" />
              <div className="h-4 bg-white/10 rounded w-32" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-4 bg-white/10 rounded w-12" />
              <div className="h-4 bg-white/10 rounded w-12" />
              <div className="h-4 bg-white/10 rounded w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
