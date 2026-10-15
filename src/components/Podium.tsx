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

/**
 * 3D Tournament Podium restyled for Broadcast Noir.
 * Uses metallic PBR-inspired Gold (#FFB020), Silver (#E2E8F0), and Bronze (#CD7F32)
 * materials with hairline borders and subtle depth cues.
 */
export function Podium({ teams }: PodiumProps) {
  const first = teams[0];
  const second = teams[1];
  const third = teams[2];

  if (!first) return null;

  return (
    <div className="w-full py-2 px-2 flex flex-col items-center select-none shrink-0 max-h-[260px]">
      <div
        style={{ perspective: '1200px' }}
        className="w-full max-w-3xl grid grid-cols-3 gap-2 sm:gap-4 items-end justify-center min-h-[170px] sm:min-h-[200px]"
      >
        {/* ━━━ 2ND PLACE (SILVER) - LEFT ━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-col items-center w-full"
        >
          {second ? (
            <div className="flex flex-col items-center mb-1 text-center">
              <div className="relative mb-0.5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl p-0.5 bg-gradient-to-tr from-slate-400 to-slate-200 border border-slate-300/40 shadow-[0_0_12px_rgba(226,232,240,0.2)]">
                  <div className="w-full h-full rounded-[10px] bg-surface flex items-center justify-center overflow-hidden">
                    {second.logoUrl ? (
                      <img src={second.logoUrl} alt={second.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-mono font-bold text-xs text-slate-300">
                        {second.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <span className="absolute -top-1.5 -right-1 w-5 h-5 rounded-full bg-slate-200 text-black font-mono font-bold text-[11px] flex items-center justify-center shadow-md">
                  2
                </span>
              </div>
              <h4 className="text-xs font-mono font-bold text-foreground truncate max-w-[80px] sm:max-w-[120px] leading-tight">
                {second.name}
              </h4>
              <div className="text-xs font-mono font-bold text-slate-300 leading-tight">
                <AnimatedCounter value={second.points} suffix=" PTS" />
              </div>
              {typeof second.kills === 'number' && (
                <span className="text-[11px] text-muted font-mono flex items-center gap-0.5">
                  <Target className="w-3 h-3 text-cyan-400" />
                  {second.kills}k
                </span>
              )}
            </div>
          ) : (
            <div className="h-10" />
          )}

          {/* 3D Stand Block 2: Silver Pedestal */}
          <div
            style={{
              transform: 'rotateX(8deg)',
              transformOrigin: 'bottom center',
            }}
            className="w-full h-[90px] sm:h-[105px] rounded-t-xl bg-gradient-to-b from-slate-700/60 via-surface-2 to-surface border-t-2 border-slate-300/70 border-x border-border flex flex-col items-center justify-between p-1.5 relative overflow-hidden shadow-lg shadow-black/40"
          >
            <div className="text-3xl sm:text-4xl font-mono font-bold text-slate-400/20 select-none pointer-events-none mt-0.5">
              2
            </div>
            <div className="w-8 h-0.5 rounded-full bg-slate-300/50 mb-0.5" />
          </div>
        </motion.div>

        {/* ━━━ 1ST PLACE (GOLD / CHAMPION) - CENTER ━━━ */}
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
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-warn filter drop-shadow-[0_0_6px_rgba(255,176,32,0.6)]">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl p-0.5 bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 shadow-[0_0_20px_rgba(255,176,32,0.35)] ring-1 ring-warn/50">
                <div className="w-full h-full rounded-[10px] bg-surface flex items-center justify-center overflow-hidden">
                  {first.logoUrl ? (
                    <img src={first.logoUrl} alt={first.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-mono font-black text-xs sm:text-sm text-warn">
                      {first.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-warn text-black font-mono font-bold text-[11px] flex items-center justify-center shadow-lg border border-black/40">
                1
              </span>
            </motion.div>

            <h3 className="text-xs sm:text-sm font-mono font-bold text-foreground truncate max-w-[90px] sm:max-w-[130px] leading-tight">
              {first.name}
            </h3>
            <div className="text-xs sm:text-sm font-mono font-bold text-warn leading-tight">
              <AnimatedCounter value={first.points} suffix=" PTS" />
            </div>
            {typeof first.kills === 'number' && (
              <span className="text-[11px] text-warn font-mono font-bold flex items-center gap-0.5">
                <Flame className="w-3 h-3 text-warn" />
                {first.kills}k
              </span>
            )}
          </div>

          {/* 3D Stand Block 1: Gold Champion Pedestal */}
          <div
            style={{
              transform: 'rotateX(8deg)',
              transformOrigin: 'bottom center',
            }}
            className="w-full h-[115px] sm:h-[135px] rounded-t-xl bg-gradient-to-b from-amber-600/50 via-surface-2 to-surface border-t-2 border-warn border-x border-warn/30 flex flex-col items-center justify-between p-2 relative overflow-hidden shadow-xl shadow-warn/15"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-warn/10 via-transparent to-transparent pointer-events-none" />
            <div className="text-4xl sm:text-5xl font-mono font-black text-warn/25 select-none pointer-events-none mt-0.5">
              1
            </div>
            <div className="flex items-center gap-1 mb-0.5">
              <Trophy className="w-3.5 h-3.5 text-warn" />
              <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-warn">
                CHAMPION
              </span>
            </div>
          </div>
        </motion.div>

        {/* ━━━ 3RD PLACE (BRONZE) - RIGHT ━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col items-center w-full"
        >
          {third ? (
            <div className="flex flex-col items-center mb-1 text-center">
              <div className="relative mb-0.5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl p-0.5 bg-gradient-to-tr from-amber-700 to-amber-600 border border-amber-600/40 shadow-[0_0_12px_rgba(205,127,50,0.2)]">
                  <div className="w-full h-full rounded-[10px] bg-surface flex items-center justify-center overflow-hidden">
                    {third.logoUrl ? (
                      <img src={third.logoUrl} alt={third.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-mono font-bold text-xs text-amber-500">
                        {third.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <span className="absolute -top-1.5 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white font-mono font-bold text-[11px] flex items-center justify-center shadow-md">
                  3
                </span>
              </div>
              <h4 className="text-xs font-mono font-bold text-foreground truncate max-w-[80px] sm:max-w-[120px] leading-tight">
                {third.name}
              </h4>
              <div className="text-xs font-mono font-bold text-amber-500 leading-tight">
                <AnimatedCounter value={third.points} suffix=" PTS" />
              </div>
              {typeof third.kills === 'number' && (
                <span className="text-[11px] text-muted font-mono flex items-center gap-0.5">
                  <Target className="w-3 h-3 text-cyan-400" />
                  {third.kills}k
                </span>
              )}
            </div>
          ) : (
            <div className="h-10" />
          )}

          {/* 3D Stand Block 3: Bronze Pedestal */}
          <div
            style={{
              transform: 'rotateX(8deg)',
              transformOrigin: 'bottom center',
            }}
            className="w-full h-[75px] sm:h-[85px] rounded-t-xl bg-gradient-to-b from-amber-800/50 via-surface-2 to-surface border-t-2 border-amber-600/60 border-x border-border flex flex-col items-center justify-between p-1.5 relative overflow-hidden shadow-lg shadow-black/40"
          >
            <div className="text-3xl sm:text-4xl font-mono font-bold text-amber-700/20 select-none pointer-events-none mt-0.5">
              3
            </div>
            <div className="w-8 h-0.5 rounded-full bg-amber-700/50 mb-0.5" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
