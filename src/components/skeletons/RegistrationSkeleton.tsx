import React from 'react';

export function RegistrationSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-pulse" aria-label="Loading registration form">
      {/* Progress Bar Skeleton */}
      <div className="flex items-center justify-between px-6 py-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10" />
            <div className="h-3 w-12 bg-white/5 rounded-md" />
          </div>
        ))}
      </div>

      {/* Form Card Skeleton */}
      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-5">
        <div className="h-7 w-48 bg-white/10 rounded-lg" />
        <div className="h-4 w-72 max-w-full bg-white/5 rounded-md" />

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <div className="h-3.5 w-24 bg-white/10 rounded" />
            <div className="h-11 w-full bg-white/5 rounded-xl border border-white/5" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 bg-white/10 rounded" />
            <div className="h-11 w-full bg-white/5 rounded-xl border border-white/5" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 bg-white/10 rounded" />
            <div className="h-11 w-full bg-white/5 rounded-xl border border-white/5" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="h-10 w-24 bg-white/10 rounded-xl" />
          <div className="h-10 w-32 bg-orange-500/30 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
