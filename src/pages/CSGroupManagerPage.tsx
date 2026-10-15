import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Users,
  Shuffle,
  AlertTriangle,
  Save,
  CheckCircle,
  HelpCircle,
  Layers,
} from 'lucide-react';
import type { LayoutContextType } from '../components/layout/Layout';
import { useTournament } from '../context/TournamentContext';
import { useTeams } from '../hooks/useFirestore';
import { updateTournament } from '../lib/firestore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { EmptyState } from '../components/EmptyState';
import { cn } from '../lib/cn';
import type { Team } from '../types';
import type { ByeStrategy } from '../lib/cs/byeStrategy';

export function CSGroupManagerPage() {
  const { game } = useOutletContext<LayoutContextType>();
  const { activeTournament } = useTournament();
  const { data: teams } = useTeams(activeTournament?.id);

  const [groupCount, setGroupCount] = useState<number>(activeTournament?.cs_group_count || 4);
  const [groups, setGroups] = useState<Record<string, string[]>>({});
  const [oddWarningModalOpen, setOddWarningModalOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<ByeStrategy>('auto_advance');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const count = activeTournament?.cs_group_count || 4;
    setGroupCount(count);
    const initialGroups: Record<string, string[]> = {};
    for (let i = 0; i < count; i++) {
      const char = String.fromCharCode(65 + i);
      initialGroups[`Group ${char}`] = [];
    }

    if (teams && teams.length > 0) {
      teams.forEach((team, index) => {
        const groupChar = String.fromCharCode(65 + (index % count));
        initialGroups[`Group ${groupChar}`].push(team.id);
      });
    }
    setGroups(initialGroups);
  }, [activeTournament?.id, teams]);

  const teamMap = new Map<string, Team>(teams.map((t) => [t.id, t]));

  const handleAutoDistribute = () => {
    const groupKeys = Object.keys(groups);
    if (groupKeys.length === 0 || teams.length === 0) return;

    const newGroups: Record<string, string[]> = {};
    groupKeys.forEach((g) => (newGroups[g] = []));

    let forward = true;
    let currentGIndex = 0;
    teams.forEach((team) => {
      const groupKey = groupKeys[currentGIndex];
      newGroups[groupKey].push(team.id);
      if (forward) {
        if (currentGIndex === groupKeys.length - 1) {
          forward = false;
        } else {
          currentGIndex++;
        }
      } else {
        if (currentGIndex === 0) {
          forward = true;
        } else {
          currentGIndex--;
        }
      }
    });

    setGroups(newGroups);
    const hasOdd = Object.values(newGroups).some((list) => list.length % 2 !== 0);
    if (hasOdd) {
      setOddWarningModalOpen(true);
    }
  };

  const handleMoveTeam = (teamId: string, fromGroup: string, toGroup: string) => {
    if (fromGroup === toGroup) return;
    setGroups((prev) => {
      const next = { ...prev };
      next[fromGroup] = (next[fromGroup] || []).filter((id) => id !== teamId);
      next[toGroup] = [...(next[toGroup] || []), teamId];
      return next;
    });
  };

  const handleGroupCountChange = (countStr: string) => {
    const count = parseInt(countStr, 10);
    setGroupCount(count);
    const newGroups: Record<string, string[]> = {};
    for (let i = 0; i < count; i++) {
      const char = String.fromCharCode(65 + i);
      newGroups[`Group ${char}`] = [];
    }

    const allAssigned = Object.values(groups).flat();
    allAssigned.forEach((teamId, index) => {
      const groupChar = String.fromCharCode(65 + (index % count));
      newGroups[`Group ${groupChar}`].push(teamId);
    });
    setGroups(newGroups);
  };

  const handleSaveToFirestore = async () => {
    if (!activeTournament) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await updateTournament(activeTournament.id, {
        cs_group_count: groupCount,
        cs_teams_per_group: Math.ceil(teams.length / groupCount),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save groups.';
      setSaveError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const groupKeys = Object.keys(groups);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-extrabold tracking-widest px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
              {game} Clash Squad
            </span>
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ADMIN
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3 font-['Teko',sans-serif] text-4xl">
            <Layers className="w-8 h-8 text-red-400" />
            CS Group Stage Manager
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Organize teams into league groups (2, 4, or 8 groups) with automated odd-team bye strategies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            onClick={handleAutoDistribute}
            disabled={teams.length === 0}
            className="text-xs"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Auto-Distribute (Snake Draft)</span>
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveToFirestore}
            disabled={isSaving || !activeTournament}
            className="text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Groups'}</span>
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Group structure and allocations saved successfully to tournament.</span>
        </div>
      )}

      {saveError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-4">
          <div className="w-48">
            <Select
              label="Group Count"
              value={String(groupCount)}
              onChange={handleGroupCountChange}
              options={[
                { value: '2', label: '2 Groups' },
                { value: '4', label: '4 Groups (Standard)' },
                { value: '8', label: '8 Groups (Championship)' },
              ]}
            />
          </div>
          <div className="text-xs text-gray-400 pt-4">
            Total Teams: <span className="text-white font-bold">{teams.length}</span> (
            ~{teams.length > 0 ? Math.round(teams.length / groupCount) : 0} teams/group)
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <HelpCircle className="w-4 h-4 text-orange-400" />
          <span>Move teams between groups using the transfer selector on each card.</span>
        </div>
      </Card>

      {teams.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-rose-400" />}
          title="No Teams Available to Group"
          description="Register or approve squads before organizing tournament groups."
        />
      ) : (
        <div
          className={cn(
            'grid gap-5',
            groupCount === 2 && 'grid-cols-1 md:grid-cols-2',
            groupCount === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
            groupCount === 8 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          )}
        >
          {groupKeys.map((groupKey) => {
            const teamIds = groups[groupKey] || [];
            const isOdd = teamIds.length % 2 !== 0 && teamIds.length > 0;
            return (
              <div
                key={groupKey}
                className="glass-card rounded-2xl border border-white/10 p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-rose-500" />
                      <h3 className="font-extrabold text-white text-base tracking-wide font-['Teko',sans-serif] text-xl">
                        {groupKey}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                        {teamIds.length} Teams
                      </span>
                      {isOdd && (
                        <span
                          title="Odd number of teams - Bye strategy applies"
                          className="p-1 rounded bg-amber-500/20 text-amber-300 text-xs cursor-pointer"
                          onClick={() => setOddWarningModalOpen(true)}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 min-h-[160px]">
                    {teamIds.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 text-xs">
                        <Users className="w-6 h-6 mb-1 opacity-40" />
                        <span>Empty Group</span>
                      </div>
                    ) : (
                      teamIds.map((teamId) => {
                        const team = teamMap.get(teamId);
                        return (
                          <div
                            key={teamId}
                            className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center font-bold text-xs text-gray-300 shrink-0">
                                {team?.teamName ? team.teamName.slice(0, 2).toUpperCase() : 'TM'}
                              </div>
                              <div className="truncate">
                                <p className="font-semibold text-white truncate">
                                  {team ? team.teamName : teamId}
                                </p>
                                {team?.teamTag && (
                                  <span className="text-xs text-slate-400 font-mono">
                                    [{team.teamTag}]
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0 ml-2">
                              <select
                                value={groupKey}
                                onChange={(e) => handleMoveTeam(teamId, groupKey, e.target.value)}
                                className="text-xs bg-black/60 text-gray-300 border border-white/10 rounded-lg px-2 py-1 outline-none cursor-pointer hover:border-orange-500/50"
                              >
                                {groupKeys.map((g) => (
                                  <option key={g} value={g} className="bg-slate-900 text-white">
                                    Move to {g}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Odd-Team Warning Modal */}
      <Modal
        open={oddWarningModalOpen}
        onClose={() => setOddWarningModalOpen(false)}
        title="Odd-Team Group Detected"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              One or more groups contain an odd number of teams. Select a Bye Strategy for match
              scheduling:
            </p>
          </div>
          <div className="space-y-2">
            {[
              {
                id: 'auto_advance',
                title: 'Auto-Advance (Standard Bye)',
                desc: 'Surplus team receives an automatic bye in odd match days and advances points/win.',
              },
              {
                id: 'rotate',
                title: 'Rotating Bye',
                desc: 'Every team in the group takes turns sitting out one round across match days.',
              },
              {
                id: 'cross_group',
                title: 'Cross-Group Exhibition Match',
                desc: 'Odd teams from different groups (e.g. Group A & Group B) play against each other.',
              },
              {
                id: 'three_way',
                title: 'Three-Way Triangular Match',
                desc: 'Odd 3 teams play a 3-way round robin series within the round.',
              },
            ].map((strategy) => (
              <label
                key={strategy.id}
                onClick={() => setSelectedStrategy(strategy.id as ByeStrategy)}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                  selectedStrategy === strategy.id
                    ? 'bg-orange-500/15 border-orange-500/50 text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                )}
              >
                <input
                  type="radio"
                  name="byeStrategy"
                  checked={selectedStrategy === strategy.id}
                  onChange={() => setSelectedStrategy(strategy.id as ByeStrategy)}
                  className="mt-1 accent-orange-500"
                />
                <div>
                  <h4 className="text-xs font-bold text-white">{strategy.title}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">{strategy.desc}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <Button variant="secondary" size="sm" onClick={() => setOddWarningModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setOddWarningModalOpen(false);
              }}
            >
              Apply Strategy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
