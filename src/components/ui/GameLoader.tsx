import React from 'react';
import { Icon } from '@iconify/react';

export interface GameLoaderProps {
  label?: string;
}

export const GameLoader: React.FC<GameLoaderProps> = ({
  label = 'DEPLOYING TO ARENA...',
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] text-white select-none overflow-hidden"
      role="status"
      aria-live="polite"
    >
      {/* Background ambient radial glow */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full bg-red-600/10 blur-[120px] pointer-events-none animate-pulse"
        aria-hidden="true"
      />

      {/* Center Tactical Container with PUBG-style spinning ring */}
      <div className="relative flex items-center justify-center">
        {/* Outer subtle radar ring */}
        <div
          className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-red-500/20 animate-ping pointer-events-none opacity-40"
          aria-hidden="true"
        />

        {/* Metallic / Neon Red Spinning Ring (PUBG / Free Fire style) */}
        <div
          className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-neutral-900 border-t-red-600 border-r-red-600/60 shadow-[0_0_30px_rgba(220,38,38,0.35)] animate-spin"
          style={{ animationDuration: '0.9s' }}
        />

        {/* Inner Counter-Spinning Accent Ring */}
        <div
          className="absolute w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-transparent border-b-red-500/70 border-l-red-500/30 animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '1.4s' }}
        />

        {/* GS Arena Core Logo in Center */}
        <div className="absolute flex flex-col items-center justify-center">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-red-700 shadow-lg shadow-red-600/40">
            <Icon
              icon="solar:cup-star-bold"
              className="text-2xl sm:text-3xl text-white drop-shadow-md"
            />
          </div>
        </div>
      </div>

      {/* Arena Tactical Loading Text & Brand Identity */}
      <div className="mt-8 text-center px-4 relative z-10">
        <h1 className="text-xl sm:text-2xl font-black tracking-wider text-white uppercase drop-shadow-sm">
          GS <span className="text-red-600">ARENA</span>
        </h1>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
          <p className="font-black tracking-widest text-red-500 text-xs sm:text-sm uppercase font-mono">
            {label}
          </p>
        </div>
        <p className="mt-1 text-[11px] font-bold tracking-widest text-neutral-500 uppercase">
          SECURE PROTOCOL • INITIALIZING TELEMETRY
        </p>
      </div>

      <span className="sr-only">{label}</span>
    </div>
  );
};

export default GameLoader;
