import React from 'react';
import { RefreshCw } from 'lucide-react';

export interface ImportProgressBarProps {
  status: string;
  percent: number;
}

export function ImportProgressBar({ status, percent }: ImportProgressBarProps) {
  return (
    <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-white flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 text-orange-400 animate-spin" />
          <span>{status || 'Processing import...'}</span>
        </span>
        <span className="font-mono font-bold text-orange-400">{Math.round(percent)}%</span>
      </div>

      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-400 rounded-full transition-all duration-300 ease-out"
        />
      </div>
    </div>
  );
}
