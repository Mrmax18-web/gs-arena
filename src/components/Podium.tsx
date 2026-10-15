import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Flame, Target } from 'lucide-react';
import { AnimatedCounter } from './ui/AnimatedCounter';

export interface PodiumTeam {
  id: string;
  name: string;
  logoUrl?: string;
  points: number;
  kills?: number;
  wwcds?: number;
}

export interface PodiumProps {
  teams: PodiumTeam[];
  compact?: boolean;
}

export function Podium({ teams }: PodiumProps) {
  const first = teams[0];
  const second = teams[1];
  const third = teams[2];

  if (!first) return null;

  return (
    <div className="w-full py-1 sm:py-2 px-2 flex flex-col items-center select-none shrink-0 max-h-[240px]">
      <div
        style={{ perspective: '1200px' }}
        className="w-full max-w-3xl grid grid-cols-3 gap-2 sm:gap-4 items-end justify-center min-h-[170px] sm:min-h-[195px]"
      >
        {/* =========================================
            2ND PLACE (SILVER / INDIGO) - LEFT
            ========================================= */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-col items-center w-full"
        >
          {second ? (
            <div className="flex flex-col items-center mb-1 text-center">
              <div className="relative mb-0.5">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl p-0.5 bg-gradient-to-tr from-slate-400 to-indigo-400 shadow-md shadow-indigo-500/20">
                  <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden">
                    {second.logoUrl ? (
                      <img src={second.logoUrl} alt={second.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-extrabold text-xs text-indigo-300">
                        {second.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <span className="absolute -top-1.5 -right-1 w-5 h-5 rounded-full bg-slate-300 text-black font-black text-xs flex items-center justify-center shadow-md">
                  2
                </span>
              </div>
              <h4 className="text-xs font-bold text-white truncate max-w-[80px] sm:max-w-[120px] leading-tight">
                {second.name}
              </h4>
              <div className="text-xs font-black font-mono text-indigo-300 leading-tight">
                <AnimatedCounter value={second.points} suffix=" PTS" />
              </div>
              {typeof second.kills === 'number' && (
                <span className="text-xs text-slate-300 font-mono flex items-center gap-0.5">
                  <Target className="w-3 h-3 text-rose-400" />
                  {second.kills}k
                </span>
              )}
            </div>
          ) : (
            <div className="h-10" />
          )}

          {/* 3D Stand Block 2: 105px */}
          <div
            style={{
              transform: 'rotateX(8deg)',
              transformOrigin: 'bottom center',
            }}
            className="w-full h-[90px] sm:h-[105px] rounded-t-xl bg-gradient-to-b from-indigo-900/60 via-slate-900/80 to-black/90 border-t-2 border-indigo-400/50 border-x border-white/10 flex flex-col items-center justify-between p-1.5 relative overflow-hidden shadow-lg shadow-indigo-500/10"
          >
            <div className="text-3xl sm:text-4xl font-black font-mono text-indigo-400/20 select-none pointer-events-none mt-0.5">
              2
            </div>
            <div className="w-8 h-0.5 rounded-full bg-indigo-400/50 mb-0.5" />
          </div>
        </motion.div>

        {/* =========================================
            1ST PLACE (GOLD / CHAMPION) - CENTER
            ========================================= */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="flex flex-col items-center w-full z-10"
        >
          <div className="flex flex-col items-center mb-1 text-center">
            <motion.div
              animate={{ y: [-1.5, 1.5, -1.5] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="relative mb-0.5"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-amber-400 filter drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl p-0.5 bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 shadow-lg shadow-orange-500/30 ring-1 ring-orange-500/30">
                <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden">
                  {first.logoUrl ? (
                    <img src={first.logoUrl} alt={first.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-black text-xs sm:text-sm text-amber-300">
                      {first.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-black font-black text-xs flex items-center justify-center shadow-lg border-2 border-black">
                1
              </span>
            </motion.div>

            <h3 className="text-xs sm:text-sm font-extrabold text-white truncate max-w-[90px] sm:max-w-[130px] font-['Teko',sans-serif] text-base sm:text-lg tracking-wide leading-tight">
              {first.name}
            </h3>
            <div className="text-xs sm:text-sm font-black font-mono text-amber-300 leading-tight">
              <AnimatedCounter value={first.points} suffix=" PTS" />
            </div>
            {typeof first.kills === 'number' && (
              <span className="text-xs text-amber-200 font-mono font-bold flex items-center gap-0.5">
                <Flame className="w-3 h-3 text-amber-300" />
                {first.kills}k
              </span>
            )}
          </div>

          {/* 3D Stand Block 1: 135px */}
          <div
            style={{
              transform: 'rotateX(8deg)',
              transformOrigin: 'bottom center',
            }}
            className="w-full h-[115px] sm:h-[135px] rounded-t-xl bg-gradient-to-b from-orange-600/70 via-amber-950/80 to-black/95 border-t-2 border-amber-400 border-x border-orange-500/30 flex flex-col items-center justify-between p-2 relative overflow-hidden shadow-xl shadow-orange-500/20"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-amber-400/10 via-transparent to-transparent pointer-events-none" />
            <div className="text-4xl sm:text-5xl font-black font-mono text-amber-400/20 select-none pointer-events-none mt-0.5">
              1
            </div>
            <div className="flex items-center gap-1 mb-0.5">
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-xs font-black uppercase tracking-widest text-amber-300">
                CHAMPION
              </span>
            </div>
          </div>
        </motion.div>

        {/* =========================================
            3RD PLACE (BRONZE / ROSE) - RIGHT
            ========================================= */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col items-center w-full"
        >
          {third ? (
            <div className="flex flex-col items-center mb-1 text-center">
              <div className="relative mb-0.5">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl p-0.5 bg-gradient-to-tr from-amber-700 to-rose-400 shadow-md shadow-rose-500/20">
                  <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden">
                    {third.logoUrl ? (
                      <img src={third.logoUrl} alt={third.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-extrabold text-xs text-rose-300">
                        {third.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <span className="absolute -top-1.5 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-md">
                  3
                </span>
              </div>
              <h4 className="text-xs font-bold text-white truncate max-w-[80px] sm:max-w-[120px] leading-tight">
                {third.name}
              </h4>
              <div className="text-xs font-black font-mono text-rose-300 leading-tight">
                <AnimatedCounter value={third.points} suffix=" PTS" />
              </div>
              {typeof third.kills === 'number' && (
                <span className="text-xs text-slate-300 font-mono flex items-center gap-0.5">
                  <Target className="w-3 h-3 text-rose-400" />
                  {third.kills}k
                </span>
              )}
            </div>
          ) : (
            <div className="h-10" />
          )}

          {/* 3D Stand Block 3: 80px */}
          <div
            style={{
              transform: 'rotateX(8deg)',
              transformOrigin: 'bottom center',
            }}
            className="w-full h-[70px] sm:h-[80px] rounded-t-xl bg-gradient-to-b from-rose-950/60 via-slate-900/80 to-black/90 border-t-2 border-rose-400/50 border-x border-white/10 flex flex-col items-center justify-between p-1.5 relative overflow-hidden shadow-lg shadow-rose-500/10"
          >
            <div className="text-3xl sm:text-4xl font-black font-mono text-rose-400/20 select-none pointer-events-none mt-0.5">
              3
            </div>
            <div className="w-8 h-0.5 rounded-full bg-rose-400/50 mb-0.5" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
