import React from 'react';
import { Icon } from '@iconify/react';

export interface PageLoaderProps {
  label?: string;
  className?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  label = 'Loading GS Arena...',
  className = '',
}) => {
  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm select-none ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="relative flex items-center justify-center">
        {/* Ambient glow backdrop */}
        <div className="absolute -inset-4 rounded-full bg-red-600/20 blur-xl animate-pulse" />

        {/* GS Arena centered branded emblem */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-red-700 shadow-2xl shadow-red-600/30">
          <Icon
            icon="solar:cup-star-bold"
            className="text-4xl text-white drop-shadow-md animate-pulse"
          />
        </div>
      </div>

      {/* Brand title and spinner */}
      <div className="mt-6 text-center">
        <h2 className="text-lg font-black tracking-tight text-white uppercase">
          GS <span className="text-red-500">Arena</span>
        </h2>
        <div className="mt-2.5 flex items-center justify-center gap-2">
          <Icon
            icon="solar:spinner-bold"
            className="animate-spin text-lg text-red-500"
          />
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            {label}
          </p>
        </div>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default PageLoader;
