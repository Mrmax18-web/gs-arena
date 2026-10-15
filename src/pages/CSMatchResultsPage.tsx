import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Swords, CheckCircle2, Trophy, RotateCcw, Save } from 'lucide-react';
import type { LayoutContextType } from '../components/layout/Layout';
import { useTournament } from '../context/TournamentContext';
import { useMatches, useTeams } from '../hooks/useFirestore';
import { updateMatch } from '../lib/firestore';
import { computeWinner, CS_DEFAULT_WIN_THRESHOLD, CS_DEFAULT_ROUNDS } from '../lib/cs/common';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/EmptyState';
import type { Match, Team } from '../types';
import { cn } from '../lib/cn';

export function CSMatchResultsPage() {
  const { game } = useOutletContext<LayoutContextType>();
  const { activeTournament } = useTournament();
  const [searchParams] = useSearchParams();
  const queryMatchId = searchParams.get('matchId');
  const { data: matches } = useMatches(activeTournament?.id);
  const { data: teams } = useTeams(activeTournament?.id);

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [rounds, setRounds] = useState<Array<'A' | 'B' | null>>(
    Array(CS_DEFAULT_ROUNDS).fill(null)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const teamMap = new Map<string, Team>(teams.map((t) => [t.id, t]));

  useEffect(() => {
    if (matches.length > 0) {
      if (queryMatchId && matches.some((m) => m.id === queryMatchId)) {
        setSelectedMatchId(queryMatchId);
      } else if (!selectedMatchId) {
        const liveOrSched = matches.find((m) => m.status === 'live' || m.status === 'scheduled');
        setSelectedMatchId(liveOrSched ? liveOrSched.id : matches[0].id);
      }
    }
  }, [matches, queryMatchId, selectedMatchId]);

  const activeMatch = matches.find((m) => m.id === selectedMatchId);

  useEffect(() => {
    if (activeMatch) {
      const aWins = activeMatch.teamARoundWins || 0;
      const bWins = activeMatch.teamBRoundWins || 0;
      const initialRounds: Array<'A' | 'B' | null> = Array(CS_DEFAULT_ROUNDS).fill(null);
      let idx = 0;
      for (let i = 0; i < aWins && idx < CS_DEFAULT_ROUNDS; i++) {
        initialRounds[idx++] = 'A';
      }
      for (let i = 0; i < bWins && idx < CS_DEFAULT_ROUNDS; i++) {
        initialRounds[idx++] = 'B';
      }
      setRounds(initialRounds);
    }
  }, [activeMatch?.id]);

  const teamA = teamMap.get(activeMatch?.teamAId || '');
  const teamB = teamMap.get(activeMatch?.teamBId || '');

  const teamAWins = rounds.filter((r) => r === 'A').length;
  const teamBWins = rounds.filter((r) => r === 'B').length;
  const winnerSide = computeWinner(teamAWins, teamBWins, CS_DEFAULT_WIN_THRESHOLD);

  const handleSetRoundWinner = (roundIndex: number, side: 'A' | 'B') => {
    setRounds((prev) => {
      const next = [...prev];
      next[roundIndex] = next[roundIndex] === side ? null : side;
      return next;
    });
  };

  const handleResetRounds = () => {
    setRounds(Array(CS_DEFAULT_ROUNDS).fill(null));
  };

  const handleSaveResult = async () => {
    if (!activeTournament || !activeMatch) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const winnerId =
        winnerSide === 'A'
          ? activeMatch.teamAId
          : winnerSide === 'B'
          ? activeMatch.teamBId
          : undefined;

      const isCompleted = winnerSide !== null;
      await updateMatch(activeTournament.id, activeMatch.id, {
        teamARoundWins: teamAWins,
        teamBRoundWins: teamBWins,
        status: isCompleted ? 'done' : teamAWins > 0 || teamBWins > 0 ? 'live' : 'scheduled',
        winnerTeamId: winnerId,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      console.warn('Error saving match results:', err);
    } finally {
      setIsSaving(false);
    }
  };

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
            <Swords className="w-8 h-8 text-rose-500" />
            CS Round-by-Round Results Entry
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Record Clash Squad 7-round score cards. First team to reach 4 round wins secures victory.
          </p>
        </div>
      </div>

      {matches.length === 0 ? (
        <EmptyState
          icon={<Swords className="w-8 h-8 text-rose-500" />}
          title="No Clash Squad Matches Found"
          description="Schedule matches in the Match Desk or generate tournament brackets before entering round scores."
        />
      ) : (
        <>
          {/* Match Selector Tabs */}
          <div className="w-full overflow-x-auto pb-2">
            <div className="flex items-center gap-2 min-w-max">
              {matches.map((m) => {
                const isSelected = m.id === selectedMatchId;
                const tA = teamMap.get(m.teamAId)?.teamName || 'Team A';
                const tB = teamMap.get(m.teamBId)?.teamName || 'Team B';
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMatchId(m.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer',
                      isSelected
                        ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-white border-orange-500 shadow-md shadow-orange-500/10'
                        : 'glass text-gray-300 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <span>
                      {tA} vs {tB}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.2 rounded font-mono',
                        m.status === 'done'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : m.status === 'live'
                          ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                          : 'bg-white/10 text-gray-400'
                      )}
                    >
                      {m.teamARoundWins || 0}-{m.teamBRoundWins || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeMatch && (
            <Card className="relative overflow-hidden p-6 sm:p-8 border border-white/15">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Team A Side */}
                <div
                  className={cn(
                    'flex flex-col items-center text-center p-6 rounded-2xl border transition-all',
                    winnerSide === 'A'
                      ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/10 border-orange-500/50 shadow-xl shadow-orange-500/20'
                      : 'bg-black/30 border-white/10'
                  )}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center font-black text-xl text-white mb-3 shadow-lg shadow-orange-500/30">
                    {teamA?.logoUrl ? (
                      <img src={teamA.logoUrl} alt={teamA.teamName} className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      teamA?.teamName?.slice(0, 2).toUpperCase() || 'A'
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white font-['Teko',sans-serif] text-2xl tracking-wide">
                    {teamA?.teamName || 'Team A'}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono mb-4">{teamA?.teamTag ? `[${teamA.teamTag}]` : 'Roster Squad'}</p>
                  <div className="text-5xl sm:text-6xl font-black font-mono text-orange-400 mb-2">
                    {teamAWins}
                  </div>
                  {winnerSide === 'A' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500 text-black text-xs font-black uppercase tracking-wider">
                      <Trophy className="w-3.5 h-3.5" />
                      VICTORY
                    </span>
                  )}
                </div>

                {/* Center Info */}
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs text-gray-400 font-mono tracking-widest">
                    VS
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block uppercase tracking-wider font-semibold">
                      Map Battlefield
                    </span>
                    <span className="text-sm font-bold text-white">
                      {activeMatch.mapName || 'Bermuda Remastered'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block uppercase tracking-wider font-semibold">
                      Round Threshold
                    </span>
                    <span className="text-xs text-amber-300 font-mono font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                      First to 4 wins
                    </span>
                  </div>
                </div>

                {/* Team B Side */}
                <div
                  className={cn(
                    'flex flex-col items-center text-center p-6 rounded-2xl border transition-all',
                    winnerSide === 'B'
                      ? 'bg-gradient-to-br from-rose-500/20 to-red-500/10 border-rose-500/50 shadow-xl shadow-rose-500/20'
                      : 'bg-black/30 border-white/10'
                  )}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center font-black text-xl text-white mb-3 shadow-lg shadow-rose-500/30">
                    {teamB?.logoUrl ? (
                      <img src={teamB.logoUrl} alt={teamB.teamName} className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      teamB?.teamName?.slice(0, 2).toUpperCase() || 'B'
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white font-['Teko',sans-serif] text-2xl tracking-wide">
                    {teamB?.teamName || 'Team B'}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono mb-4">{teamB?.teamTag ? `[${teamB.teamTag}]` : 'Roster Squad'}</p>
                  <div className="text-5xl sm:text-6xl font-black font-mono text-rose-400 mb-2">
                    {teamBWins}
                  </div>
                  {winnerSide === 'B' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-black uppercase tracking-wider">
                      <Trophy className="w-3.5 h-3.5" />
                      VICTORY
                    </span>
                  )}
                </div>
              </div>

              {/* 7-Round Controller Buttons */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                    Round-by-Round Outcome (Click A or B to toggle win)
                  </span>
                  <button
                    type="button"
                    onClick={handleResetRounds}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Rounds</span>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2 sm:gap-3">
                  {rounds.map((winner, idx) => {
                    const roundNum = idx + 1;
                    return (
                      <div
                        key={roundNum}
                        className={cn(
                          'flex flex-col items-center p-2 rounded-xl border text-center transition-all',
                          winner === 'A'
                            ? 'bg-orange-500/20 border-orange-500/60 shadow-md shadow-orange-500/10'
                            : winner === 'B'
                            ? 'bg-rose-500/20 border-rose-500/60 shadow-md shadow-rose-500/10'
                            : 'bg-black/40 border-white/10'
                        )}
                      >
                        <span className="text-[11px] font-bold text-gray-400 mb-2">R{roundNum}</span>
                        <div className="flex flex-col w-full gap-1">
                          <button
                            type="button"
                            onClick={() => handleSetRoundWinner(idx, 'A')}
                            className={cn(
                              'py-1 rounded text-[11px] font-bold transition-all cursor-pointer',
                              winner === 'A'
                                ? 'bg-orange-500 text-black font-extrabold shadow-sm'
                                : 'bg-white/5 text-gray-300 hover:bg-orange-500/30'
                            )}
                          >
                            A
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetRoundWinner(idx, 'B')}
                            className={cn(
                              'py-1 rounded text-[11px] font-bold transition-all cursor-pointer',
                              winner === 'B'
                                ? 'bg-rose-500 text-white font-extrabold shadow-sm'
                                : 'bg-white/5 text-gray-300 hover:bg-rose-500/30'
                            )}
                          >
                            B
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Commit Action */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
                {saveSuccess ? (
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Match results committed to Firestore!</span>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">
                    {winnerSide
                      ? `Match concluded! Winner: Team ${winnerSide} (${winnerSide === 'A' ? teamA?.teamName : teamB?.teamName})`
                      : 'Match in progress. Minimum 4 round wins required for conclusion.'}
                  </div>
                )}
                <Button
                  variant="primary"
                  onClick={handleSaveResult}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Result...' : 'Save & Publish Score'}</span>
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
