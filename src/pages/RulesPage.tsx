import React, { useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { Tabs } from '../components/ui/Tabs';
import { CANONICAL_GAMES } from '../lib/constants';
import { GameId } from '../types/game';
import { MANDATORY_POLICIES, RULES_VERSION, RULES_DISCLAIMER } from '../lib/rulesConstants';
import { Icon } from '@iconify/react';

export const RulesPage: React.FC = () => {
  const [selectedGameId, setSelectedGameId] = useState<GameId>('BGMI');
  const game = CANONICAL_GAMES[selectedGameId];

  const tabs = [
    { id: 'BGMI', label: 'BGMI (BGIS Standard)' },
    { id: 'FF_BR', label: 'Free Fire - BR' },
    { id: 'FF_CS', label: 'Free Fire - Clash Squad' },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 text-left">
      <div className="border-b border-slate-200 dark:border-white/10 pb-4">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Official Tournament Rules & Scoring System
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Detailed scoring metrics, mathematical formulas, and tie-breaking hierarchies for all competitive esports titles.
        </p>
      </div>

      {/* Mandatory Competitive Policies Banner */}
      <GlassCard strong className="p-6 space-y-4 border-amber-500/30 bg-amber-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
          <div className="flex items-center gap-2">
            <Icon icon="solar:shield-warning-bold" className="text-2xl text-amber-500" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Mandatory Tournament Policies & Code of Conduct
            </h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            Ruleset v{RULES_VERSION} &bull; Strict Enforcement
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MANDATORY_POLICIES.map((policy) => (
            <div
              key={policy.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-black/10 dark:bg-black/30 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {policy.title}
                </span>
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  {policy.badge}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {policy.shortSummary}
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {policy.fullPolicy}
              </p>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-black/20 border border-slate-200/10 text-xs text-slate-400 flex items-start gap-2">
          <Icon icon="solar:info-circle-bold" className="text-amber-500 text-base shrink-0 mt-0.5" />
          <span>{RULES_DISCLAIMER}</span>
        </div>
      </GlassCard>

      {/* Game Selector Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={selectedGameId}
        onChange={(id) => setSelectedGameId(id as GameId)}
      />


      {/* Scoring Table */}
      <GlassCard strong className="p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
          <Icon icon="solar:calculator-bold" className="text-xl text-brand-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {game.name} &bull; Scoring Matrix
          </h3>
        </div>

        {selectedGameId === 'FF_CS' ? (
          <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
            <p>
              Clash Squad matches follow standard 4v4 round-based esports rules:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong>Match Win:</strong> 1 Tournament Point</li>
              <li><strong>Match Loss:</strong> 0 Tournament Points</li>
              <li><strong>Round Tracking:</strong> Rounds won and lost are recorded each match to compute cumulative Round Difference (<code className="font-mono">Rounds Won - Rounds Lost</code>).</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 text-[10px] uppercase font-semibold">
                    <th className="py-2 px-3">Placement</th>
                    <th className="py-2 px-3 text-right">Placement Points</th>
                    <th className="py-2 px-3 text-right">Kill Points Multiplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono">
                  {game.placementPoints.slice(1, selectedGameId === 'BGMI' ? 9 : 11).map((pts, idx) => {
                    const rank = idx + 1;
                    return (
                      <tr key={rank} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="py-2 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                          {rank === 1 ? '1st Place (WWCD / Booyah)' : rank === 2 ? '2nd Place' : rank === 3 ? '3rd Place' : `${rank}th Place`}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-brand-500">{pts} PTS</td>
                        <td className="py-2 px-3 text-right text-slate-400">1 PT / Kill</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-slate-500">
                      {selectedGameId === 'BGMI' ? '9th to 16th Place' : '11th Place and below'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-400">0 PTS</td>
                    <td className="py-2 px-3 text-right text-slate-400">1 PT / Kill</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl bg-black/5 dark:bg-black/20 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Total Match Points Formula:
              </span>
              <p className="font-mono text-brand-600 dark:text-brand-400">
                teamMatchPoints = placementPoints[placement] + (teamKills &times; 1)
              </p>
              <p className="text-[11px]">
                Example: Finishing 1st with 9 team kills in BGMI yields: 10 + (9 &times; 1) = 19 Total Points.
              </p>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Tie-Breaker Rules */}
      <GlassCard strong className="p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
          <Icon icon="solar:shield-warning-bold" className="text-xl text-amber-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Official Tie-Breaker Protocol
          </h3>
        </div>

        {selectedGameId === 'FF_CS' ? (
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <li><strong>Total Match Wins:</strong> The team with the highest number of match wins ranks higher.</li>
            <li><strong>Round Difference:</strong> Total rounds won minus total rounds lost across all matches.</li>
            <li><strong>Rounds Won:</strong> Highest gross number of rounds won.</li>
            <li><strong>Alphabetical Name:</strong> Stable alphabetical order.</li>
          </ol>
        ) : (
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <li><strong>Total Points:</strong> Combined placement points and kill points.</li>
            <li><strong>Total Placement Points:</strong> Team with the higher placement points total.</li>
            <li><strong>Total Kills:</strong> Team with higher gross frags.</li>
            <li><strong>WWCD Count:</strong> Highest number of 1st-place match finishes.</li>
            <li><strong>Latest Match Placement:</strong> Best finish position in the most recent completed match.</li>
            <li><strong>Alphabetical Order:</strong> Consistent, deterministic team name ordering.</li>
          </ol>
        )}
      </GlassCard>

      {/* MVP and Top Fragger Calculation Formula */}
      <GlassCard strong className="p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
          <Icon icon="solar:crown-star-bold" className="text-xl text-amber-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            MVP & Top Fragger Calculation Formulas
          </h3>
        </div>

        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <div>
            <span className="font-bold text-sm text-slate-900 dark:text-white block mb-1">
              Most Valuable Player (MVP) Impact Metric:
            </span>
            <p className="font-mono p-3 rounded-xl bg-black/5 dark:bg-black/30 text-amber-600 dark:text-amber-400 text-xs">
              impact = (kills &times; 2.5) + (damage / 100) + (assists &times; 1.0) + ((survivalSeconds / 60) &times; 0.2) + (revives &times; 1.5)
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Worked check: 5 kills, 800 damage, 2 assists, 1500s survival, 1 revive gives: 12.5 + 8.0 + 2.0 + 5.0 + 1.5 = <strong>29.0 Points</strong>.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-white/10">
            <span className="font-bold text-sm text-slate-900 dark:text-white block mb-1">
              Top Fragger Selection:
            </span>
            <p className="text-xs">
              The player with the highest total kills in the selected scope (match or tournament). Ties are broken by fewer matches played, then alphabetical name.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default RulesPage;

