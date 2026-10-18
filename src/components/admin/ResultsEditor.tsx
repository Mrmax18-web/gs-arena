import React, { useState } from 'react';
import { Match, ScoringSnapshot, Team, TeamMatchResult } from '../../types/tournament';
import { GameId } from '../../types/game';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { calculateBRMatchPoints } from '../../lib/scoring';
import { validateMatchResults } from '../../lib/validators';
import { saveMatchResults } from '../../services/tournamentService';

interface ResultsEditorProps {
  tournamentId: string;
  match: Match;
  teams: Team[];
  gameId: GameId;
  snapshot: ScoringSnapshot;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ResultsEditor: React.FC<ResultsEditorProps> = ({
  tournamentId,
  match,
  teams,
  gameId,
  snapshot,
  onSuccess,
  onCancel,
}) => {
  const { success, error } = useToast();
  const isCS = gameId === 'FF_CS';

  // Initialize results state from existing match.results or initialize with teams
  const [results, setResults] = useState<TeamMatchResult[]>(() => {
    if (match.results && match.results.length > 0) {
      return match.results;
    }
    // Build initial template for all tournament teams
    return (teams || []).map((t, idx) => ({
      teamId: t.id,
      teamName: t.teamName,
      placement: idx + 1,
      kills: 0,
      placementPoints: 0,
      killPoints: 0,
      totalPoints: 0,
      roundsWon: 0,
      roundsLost: 0,
      playerStats: (t.players || []).map((pName, pIdx) => ({
        playerId: `p-${t.id}-${pIdx}`,
        playerName: pName,
        kills: 0,
        damage: 0,
        assists: 0,
        survivalSeconds: 0,
        revives: 0,
      })),
    }));
  });

  const [saving, setSaving] = useState(false);

  const updateTeamPlacement = (teamIndex: number, placement: number) => {
    setResults((prev) => {
      const copy = [...prev];
      const team = { ...copy[teamIndex], placement };
      if (!isCS) {
        const pts = calculateBRMatchPoints(placement, team.kills, snapshot);
        team.placementPoints = pts.placementPoints;
        team.killPoints = pts.killPoints;
        team.totalPoints = pts.totalPoints;
      }
      copy[teamIndex] = team;
      return copy;
    });
  };

  const updatePlayerStat = (
    teamIndex: number,
    playerIndex: number,
    field: 'kills' | 'damage' | 'assists' | 'survivalSeconds' | 'revives',
    val: number
  ) => {
    setResults((prev) => {
      const copy = [...prev];
      const team = { ...copy[teamIndex] };
      const players = [...team.playerStats];
      players[playerIndex] = {
        ...players[playerIndex],
        [field]: Math.max(0, val),
      };
      team.playerStats = players;

      // Auto update team kills from player kills
      const sumKills = players.reduce((sum, p) => sum + (p.kills ?? 0), 0);
      team.kills = sumKills;

      if (!isCS) {
        const pts = calculateBRMatchPoints(team.placement, sumKills, snapshot);
        team.placementPoints = pts.placementPoints;
        team.killPoints = pts.killPoints;
        team.totalPoints = pts.totalPoints;
      }

      copy[teamIndex] = team;
      return copy;
    });
  };

  const updateRounds = (teamIndex: number, field: 'roundsWon' | 'roundsLost', val: number) => {
    setResults((prev) => {
      const copy = [...prev];
      const team = { ...copy[teamIndex], [field]: Math.max(0, val) };
      copy[teamIndex] = team;
      return copy;
    });
  };

  const handleSave = async () => {
    // 1. Consistency validation
    const check = validateMatchResults(results as any);
    if (!check.valid) {
      error('Validation Failed', check.error);
      return;
    }

    setSaving(true);
    try {
      await saveMatchResults(tournamentId, match.id, results);
      success('Results Saved', `Match #${match.matchNumber} results recorded and standings updated.`);
      onSuccess();
    } catch (err: any) {
      error('Save Error', err?.message || 'Failed to save results.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard strong className="p-6 text-left space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <h4 className="text-lg font-black text-slate-900 dark:text-white">
            Enter Results: Match #{match.matchNumber} ({match.map})
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Enter placement and player-level statistics. All totals are derived dynamically.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={handleSave} icon="solar:check-read-bold">
            Publish Results
          </Button>
        </div>
      </div>

      {results.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">
          No teams found in this tournament roster. Please add teams or approve registrations first.
        </p>
      ) : (
        <div className="space-y-6">
          {results.map((teamResult, tIdx) => {
            const sumPlayerKills = teamResult.playerStats.reduce((s, p) => s + (p.kills ?? 0), 0);
            const killsMatch = sumPlayerKills === teamResult.kills;

            return (
              <div
                key={teamResult.teamId || tIdx}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 p-5 space-y-4"
              >
                {/* Team Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {teamResult.teamName}
                    </span>
                    {!killsMatch && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">
                        Kills Mismatch: Team ({teamResult.kills}) &ne; Players ({sumPlayerKills})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-28">
                      <Input
                        label="Placement"
                        type="number"
                        min={1}
                        value={teamResult.placement}
                        onChange={(e) => updateTeamPlacement(tIdx, Number(e.target.value))}
                        className="py-1 text-xs text-center"
                      />
                    </div>

                    {isCS && (
                      <>
                        <div className="w-20">
                          <Input
                            label="Rounds Won"
                            type="number"
                            min={0}
                            value={teamResult.roundsWon ?? 0}
                            onChange={(e) => updateRounds(tIdx, 'roundsWon', Number(e.target.value))}
                            className="py-1 text-xs text-center"
                          />
                        </div>
                        <div className="w-20">
                          <Input
                            label="Rounds Lost"
                            type="number"
                            min={0}
                            value={teamResult.roundsLost ?? 0}
                            onChange={(e) => updateRounds(tIdx, 'roundsLost', Number(e.target.value))}
                            className="py-1 text-xs text-center"
                          />
                        </div>
                      </>
                    )}

                    {!isCS && (
                      <div className="text-right text-xs">
                        <span className="text-[10px] text-slate-400 block">Match Pts</span>
                        <span className="font-mono font-bold text-brand-500">
                          {teamResult.totalPoints} PTS
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Player Stats Editor */}
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Player Statistics (for MVP & Top Fragger)
                  </span>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 text-[10px] uppercase font-semibold">
                          <th className="py-1.5 px-2">Player</th>
                          <th className="py-1.5 px-2 w-20">Kills</th>
                          <th className="py-1.5 px-2 w-24">Damage</th>
                          <th className="py-1.5 px-2 w-20">Assists</th>
                          <th className="py-1.5 px-2 w-28">Survival (Sec)</th>
                          <th className="py-1.5 px-2 w-20">Revives</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {teamResult.playerStats.map((p, pIdx) => (
                          <tr key={p.playerId || pIdx}>
                            <td className="py-2 px-2 font-medium text-slate-800 dark:text-slate-200">
                              {p.playerName}
                            </td>
                            <td className="py-1 px-2">
                              <input
                                type="number"
                                min={0}
                                value={p.kills}
                                onChange={(e) =>
                                  updatePlayerStat(tIdx, pIdx, 'kills', Number(e.target.value))
                                }
                                className="w-16 rounded-lg border border-slate-300 dark:border-white/10 bg-transparent px-2 py-1 text-center font-mono text-xs focus:border-brand-500 focus:outline-none"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <input
                                type="number"
                                min={0}
                                value={p.damage}
                                onChange={(e) =>
                                  updatePlayerStat(tIdx, pIdx, 'damage', Number(e.target.value))
                                }
                                className="w-20 rounded-lg border border-slate-300 dark:border-white/10 bg-transparent px-2 py-1 text-center font-mono text-xs focus:border-brand-500 focus:outline-none"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <input
                                type="number"
                                min={0}
                                value={p.assists}
                                onChange={(e) =>
                                  updatePlayerStat(tIdx, pIdx, 'assists', Number(e.target.value))
                                }
                                className="w-16 rounded-lg border border-slate-300 dark:border-white/10 bg-transparent px-2 py-1 text-center font-mono text-xs focus:border-brand-500 focus:outline-none"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <input
                                type="number"
                                min={0}
                                value={p.survivalSeconds}
                                onChange={(e) =>
                                  updatePlayerStat(tIdx, pIdx, 'survivalSeconds', Number(e.target.value))
                                }
                                className="w-24 rounded-lg border border-slate-300 dark:border-white/10 bg-transparent px-2 py-1 text-center font-mono text-xs focus:border-brand-500 focus:outline-none"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <input
                                type="number"
                                min={0}
                                value={p.revives}
                                onChange={(e) =>
                                  updatePlayerStat(tIdx, pIdx, 'revives', Number(e.target.value))
                                }
                                className="w-16 rounded-lg border border-slate-300 dark:border-white/10 bg-transparent px-2 py-1 text-center font-mono text-xs focus:border-brand-500 focus:outline-none"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
};
