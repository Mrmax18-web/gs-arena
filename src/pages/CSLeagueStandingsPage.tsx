import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Trophy, Filter, Shield } from 'lucide-react';
import type { LayoutContextType } from '../components/layout/Layout';
import { useTournament } from '../context/TournamentContext';
import { useTeams, useMatches } from '../hooks/useFirestore';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/EmptyState';
import { cn } from '../lib/cn';
import type { Team, Game } from '../types';

interface TeamStanding {
  team: Team;
  groupLabel: string;
  played: number;
  wins: number;
  losses: number;
  byes: number;
  roundsWon: number;
  roundsLost: number;
  roundDiff: number;
  form: Array<'W' | 'L'>;
}

export interface CSLeagueStandingsPageProps {
  propGame?: Game;
}

export function CSLeagueStandingsPage({ propGame }: CSLeagueStandingsPageProps = {}) {
  const context = useOutletContext<LayoutContextType | null>();
  const { activeTournament } = useTournament();
  const game = propGame || context?.game || activeTournament?.game || 'Free Fire';
  const { data: teams } = useTeams(activeTournament?.id);
  const { data: matches } = useMatches(activeTournament?.id);
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  const standings = useMemo(() => {
    if (!teams || teams.length === 0) return [];

    const map = new Map<string, TeamStanding>();
    teams.forEach((team) => {
      map.set(team.id, {
        team,
        groupLabel: 'Group A',
        played: 0,
        wins: 0,
        losses: 0,
        byes: 0,
        roundsWon: 0,
        roundsLost: 0,
        roundDiff: 0,
        form: [],
      });
    });

    matches.forEach((m) => {
      if (m.status !== 'done' && !m.winnerTeamId) return;

      const teamAStats = map.get(m.teamAId);
      const teamBStats = map.get(m.teamBId);

      if (teamAStats && m.groupLabel) {
        teamAStats.groupLabel = m.groupLabel;
      }
      if (teamBStats && m.groupLabel) {
        teamBStats.groupLabel = m.groupLabel;
      }

      if (m.teamAId && !m.teamBId && teamAStats) {
        teamAStats.byes += 1;
        teamAStats.wins += 1;
        teamAStats.played += 1;
        teamAStats.form.push('W');
        return;
      }

      const aWins = m.teamARoundWins || 0;
      const bWins = m.teamBRoundWins || 0;

      if (teamAStats) {
        teamAStats.played += 1;
        teamAStats.roundsWon += aWins;
        teamAStats.roundsLost += bWins;
        if (m.winnerTeamId === m.teamAId || aWins > bWins) {
          teamAStats.wins += 1;
          teamAStats.form.push('W');
        } else {
          teamAStats.losses += 1;
          teamAStats.form.push('L');
        }
      }

      if (teamBStats) {
        teamBStats.played += 1;
        teamBStats.roundsWon += bWins;
        teamBStats.roundsLost += aWins;
        if (m.winnerTeamId === m.teamBId || bWins > aWins) {
          teamBStats.wins += 1;
          teamBStats.form.push('W');
        } else {
          teamBStats.losses += 1;
          teamBStats.form.push('L');
        }
      }
    });

    const list: TeamStanding[] = Array.from(map.values()).map((s) => ({
      ...s,
      roundDiff: s.roundsWon - s.roundsLost,
      form: s.form.slice(-5),
    }));

    list.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.roundDiff - a.roundDiff;
    });

    return list;
  }, [teams, matches]);

  const uniqueGroups = useMemo(() => {
    const set = new Set<string>();
    standings.forEach((s) => set.add(s.groupLabel));
    return Array.from(set).sort();
  }, [standings]);

  const filteredStandings = useMemo(() => {
    if (selectedGroup === 'ALL') return standings;
    return standings.filter((s) => s.groupLabel === selectedGroup);
  }, [standings, selectedGroup]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl p-5 border border-white/10 bg-black/40">
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/freefire-icon.png"
            alt=""
            role="presentation"
            className="w-full h-full object-cover opacity-20"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-red-950/80 via-black/90 to-[#03040a]" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-extrabold tracking-widest px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                {game} Clash Squad
              </span>
              <span className="text-xs text-gray-400">Pure W/L League Ranking</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3 font-['Teko',sans-serif] text-4xl">
              <Trophy className="w-8 h-8 text-amber-400" />
              CS League Standings
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Rankings determined strictly by Match Wins and Round Differential. No placement points.
            </p>
          </div>

          {uniqueGroups.length > 1 && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedGroup('ALL')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                    selectedGroup === 'ALL'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  All Groups
                </button>
                {uniqueGroups.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGroup(g)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                      selectedGroup === g
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {teams.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-8 h-8 text-amber-400" />}
          title="No Clash Squad Standings Available"
          description="Standings will populate here in real-time as squads complete Clash Squad matches."
        />
      ) : (
        <Card className="p-0 overflow-hidden border border-white/10">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 text-center w-14">Rank</th>
                  <th className="py-3.5 px-4">Team</th>
                  <th className="py-3.5 px-3">Group</th>
                  <th className="py-3.5 px-3 text-center">Played</th>
                  <th className="py-3.5 px-3 text-center font-bold text-emerald-400">Wins</th>
                  <th className="py-3.5 px-3 text-center font-bold text-rose-400">Losses</th>
                  <th className="py-3.5 px-3 text-center text-amber-300">Byes</th>
                  <th className="py-3.5 px-3 text-center font-mono">Round Diff</th>
                  <th className="py-3.5 px-4 text-center">Form (Last 5)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-200">
                {filteredStandings.map((s, idx) => {
                  const rank = idx + 1;
                  const isTop = rank <= 2;
                  return (
                    <tr
                      key={s.team.id}
                      className={cn(
                        'hover:bg-white/[0.04] transition-colors',
                        isTop && 'bg-orange-500/[0.02]'
                      )}
                    >
                      <td className="py-3 px-4 text-center font-black">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono',
                            rank === 1 && 'bg-amber-400 text-black font-extrabold shadow-sm shadow-amber-400/30',
                            rank === 2 && 'bg-slate-300 text-black font-extrabold',
                            rank === 3 && 'bg-amber-700 text-white font-extrabold',
                            rank > 3 && 'text-gray-400'
                          )}
                        >
                          {rank}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {s.team.logoUrl ? (
                            <img
                              src={s.team.logoUrl}
                              alt={s.team.teamName}
                              className="w-6 h-6 rounded-md object-cover border border-white/20"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center font-bold text-xs text-gray-300">
                              {s.team.teamName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-white block truncate max-w-[180px]">
                              {s.team.teamName}
                            </span>
                            {s.team.teamTag && (
                              <span className="text-xs text-slate-400 font-mono">
                                [{s.team.teamTag}]
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-white/5 border border-white/10 text-gray-300">
                          {s.groupLabel}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-gray-300">
                        {s.played}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-extrabold text-emerald-400 bg-emerald-500/5">
                        {s.wins}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-rose-400">
                        {s.losses}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-amber-300">
                        {s.byes}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        <span
                          className={cn(
                            s.roundDiff > 0 && 'text-emerald-400',
                            s.roundDiff < 0 && 'text-rose-400',
                            s.roundDiff === 0 && 'text-gray-400'
                          )}
                        >
                          {s.roundDiff > 0 ? `+${s.roundDiff}` : s.roundDiff}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {s.form.length === 0 ? (
                            <span className="text-xs text-gray-400">-</span>
                          ) : (
                            s.form.map((res, fIdx) => (
                              <span
                                key={fIdx}
                                className={cn(
                                  'w-5 h-5 rounded-full flex items-center justify-center text-xs font-black',
                                  res === 'W'
                                    ? 'bg-emerald-500 text-black font-extrabold'
                                    : 'bg-rose-500 text-white font-extrabold'
                                )}
                              >
                                {res}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
