import React from 'react';
import { AwardWinner } from '../../types/tournament';
import { GlassCard } from '../ui/GlassCard';
import { PeekingCardList } from '../ui/PeekingCardList';
import { Icon } from '@iconify/react';

export interface AwardBadgesProps {
  mvp: AwardWinner | null;
  topFragger: AwardWinner | null;
  scopeLabel?: string;
}

export const AwardBadges: React.FC<AwardBadgesProps> = ({ mvp, topFragger, scopeLabel }) => {
  return (
    <PeekingCardList ariaLabel="Tournament MVP and Top Fragger awards" className="my-6">
      {/* MVP Award Card */}
      <GlassCard className="relative overflow-hidden p-5 border-amber-500/30 text-left">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
              <Icon icon="solar:crown-star-bold" className="text-lg" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Tournament MVP
            </span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-slate-400">
            {mvp?.scope || scopeLabel || 'Tournament'}
          </span>
        </div>

        {mvp ? (
          <div>
            <div className="flex items-baseline justify-between">
              <h4 className="text-lg font-black text-slate-900 dark:text-white truncate">
                {mvp.playerName}
              </h4>
              <span className="text-xs font-mono font-bold text-amber-500">
                {mvp.score.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">PTS</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Team: <span className="font-semibold text-slate-700 dark:text-slate-300">{mvp.teamName}</span>
            </p>
          </div>
        ) : (
          <div className="py-2 text-xs text-slate-500 dark:text-slate-400 italic flex items-center gap-1.5">
            <Icon icon="solar:info-circle-bold" className="text-sm shrink-0" />
            <span>MVP unavailable (awaiting completed match statistics)</span>
          </div>
        )}
      </GlassCard>

      {/* Top Fragger Award Card */}
      <GlassCard className="relative overflow-hidden p-5 border-rose-500/30 text-left">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-500">
              <Icon icon="solar:target-bold" className="text-lg" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
              Top Fragger
            </span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-slate-400">
            {topFragger?.scope || scopeLabel || 'Tournament'}
          </span>
        </div>

        {topFragger ? (
          <div>
            <div className="flex items-baseline justify-between">
              <h4 className="text-lg font-black text-slate-900 dark:text-white truncate">
                {topFragger.playerName}
              </h4>
              <span className="text-xs font-mono font-bold text-rose-500">
                {topFragger.score} <span className="text-[10px] font-normal text-slate-400">KILLS</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Team: <span className="font-semibold text-slate-700 dark:text-slate-300">{topFragger.teamName}</span>
            </p>
          </div>
        ) : (
          <div className="py-2 text-xs text-slate-500 dark:text-slate-400 italic flex items-center gap-1.5">
            <Icon icon="solar:info-circle-bold" className="text-sm shrink-0" />
            <span>Top Fragger unavailable (no kills recorded)</span>
          </div>
        )}
      </GlassCard>
    </PeekingCardList>
  );
};
