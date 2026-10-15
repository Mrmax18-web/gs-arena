import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Swords,
  Trophy,
  Clock,
  Save,
  Plus,
  Shield,
  Play,
  Flag,
  Timer,
  PlayCircle,
} from 'lucide-react';
import type { LayoutContextType } from '../components/layout/Layout';
import { useTournament } from '../context/TournamentContext';
import { useGame } from '../context/GameContext';
import { useMatches, useTeams } from '../hooks/useFirestore';
import { updateMatch, createMatch } from '../lib/firestore';
import { PageHeader } from '../components/ui/PageHeader';
import { TiltCard } from '../components/ui/TiltCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TagChip } from '../components/ui/TagChip';
import { LiveBadge } from '../components/ui/LiveBadge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { EmptyState } from '../components/EmptyState';
import { MatchCountdown } from '../components/MatchCountdown';
import { cn } from '../lib/cn';
import type { Match, Team } from '../types';

/**
 * Broadcast-grade match scoring and operations desk.
 * Controls match schedules, real-time round tallies, and victor allocation.
 */
export function MatchResultsPage() {
  const { currentGame } = useGame();
  const outletContext = useOutletContext<LayoutContextType | null>();
  const game = outletContext?.game || currentGame || 'BGMI';
  const { activeTournament } = useTournament();
  const { data: matches } = useMatches(activeTournament?.id);
  const { data: teams } = useTeams(activeTournament?.id);

  const [scoringMatch, setScoringMatch] = useState<Match | null>(null);
  const [teamARounds, setTeamARounds] = useState<number>(0);
  const [teamBRounds, setTeamBRounds] = useState<number>(0);
  const [matchStatus, setMatchStatus] = useState<Match['status']>('scheduled');
  const [isSaving, setIsSaving] = useState(false);

  // FEATURE 2: 30s Countdown State
  const [countdownMatch, setCountdownMatch] = useState<Match | null>(null);
  const [countdownStartedAt, setCountdownStartedAt] = useState<string>('');

  // New Match Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTeamA, setNewTeamA] = useState('');
  const [newTeamB, setNewTeamB] = useState('');
  const [newMap, setNewMap] = useState('Erangel');

  const teamMap = new Map<string, Team>(teams.map((t) => [t.id, t]));

  const openScoringDialog = (m: Match) => {
    setScoringMatch(m);
    setTeamARounds(m.teamARoundWins || 0);
    setTeamBRounds(m.teamBRoundWins || 0);
    setMatchStatus(m.status || 'scheduled');
  };

  const handleStartMatchCountdown = (m: Match) => {
    const started = new Date().toISOString();
    setCountdownStartedAt(started);
    setCountdownMatch(m);
  };

  const handleCountdownFinished = async () => {
    if (!activeTournament || !countdownMatch) return;
    try {
      await updateMatch(activeTournament.id, countdownMatch.id, {
        status: 'live',
        matchStartedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Failed to set match live:', err);
    } finally {
      setCountdownMatch(null);
    }
  };

  const handleEndMatch = async (m: Match) => {
    if (!activeTournament) return;
    try {
      await updateMatch(activeTournament.id, m.id, {
        status: 'done',
        endedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Failed to end match:', err);
    }
  };

  const handleSaveScore = async () => {
    if (!activeTournament || !scoringMatch) return;
    setIsSaving(true);
    try {
      const winnerId =
        teamARounds > teamBRounds
          ? scoringMatch.teamAId
          : teamBRounds > teamARounds
          ? scoringMatch.teamBId
          : undefined;

      await updateMatch(activeTournament.id, scoringMatch.id, {
        teamARoundWins: teamARounds,
        teamBRoundWins: teamBRounds,
        status: matchStatus,
        winnerTeamId: winnerId,
      });

      setScoringMatch(null);
    } catch (err: unknown) {
      console.warn('Error saving match score:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateMatch = async () => {
    if (!activeTournament || !newTeamA || !newTeamB) return;
    setIsSaving(true);
    try {
      await createMatch(activeTournament.id, {
        teamAId: newTeamA,
        teamBId: newTeamB,
        mapName: newMap,
        roundNumber: matches.length + 1,
        status: 'scheduled',
        teamARoundWins: 0,
        teamBRoundWins: 0,
        scheduledAt: new Date().toISOString(),
      });
      setCreateModalOpen(false);
      setNewTeamA('');
      setNewTeamB('');
    } catch (err: unknown) {
      console.warn('Error creating match:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${game} Match Control Desk`}
        subtitle="Manage scheduled tournament matches, update real-time scores, and confirm victor allocations."
        tag="ADMIN OPERATIONS"
        gradient={game === 'Free Fire' ? 'red' : 'orange'}
        icon={<Swords className="w-8 h-8 text-rose-500" />}
        action={
          <Button
            size="sm"
            variant="primary"
            onClick={() => setCreateModalOpen(true)}
            disabled={teams.length < 2}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Match</span>
          </Button>
        }
      />

      {/* Grid of Matches */}
      {matches.length === 0 ? (
        <EmptyState
          icon={<Swords className="w-8 h-8 text-rose-500" />}
          title="No Matches Scheduled Yet"
          description={
            teams.length < 2
              ? "Register at least 2 teams before scheduling tournament matches."
              : "Click 'Schedule Match' to pair squads and record battle results."
          }
          action={
            teams.length >= 2 ? (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule First Match</span>
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {matches.map((m) => {
            const teamA = teamMap.get(m.teamAId);
            const teamB = teamMap.get(m.teamBId);
            const isDone = m.status === 'done';
            const isLive = m.status === 'live';

            return (
              <TiltCard key={m.id} intensity={7} glow={isLive ? '#E63946' : '#FF6B35'}>
                <Card className="p-5 bg-gradient-to-br from-white/[0.04] to-black/60 border border-white/10 hover:border-orange-500/40 flex flex-col justify-between">
                  <div>
                    {/* Match Card Header */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-gray-400">
                          Round {m.roundNumber || 1}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-xs text-orange-400 font-semibold">
                          {m.mapName || 'Erangel'}
                        </span>
                      </div>
                      {isLive ? (
                        <LiveBadge label="LIVE BATTLE" />
                      ) : isDone ? (
                        <TagChip label="COMPLETED" variant="success" size="sm" />
                      ) : (
                        <TagChip label={m.status.toUpperCase()} variant="cyan" size="sm" />
                      )}
                    </div>

                    {/* Teams Confrontation Row */}
                    <div className="grid grid-cols-5 gap-2 items-center text-center my-3">
                      <div className="col-span-2 text-left">
                        <h2 className="font-bold text-white text-base truncate font-['Teko',sans-serif] text-xl leading-none">
                          {teamA?.teamName || m.teamAId || 'Team A'}
                        </h2>
                        <span className="text-xs text-slate-300 font-mono">
                          {teamA?.teamTag ? `[${teamA.teamTag}]` : ''}
                        </span>
                      </div>
                      <div className="col-span-1 flex flex-col items-center">
                        <div className="text-xl font-black font-mono text-orange-400">
                          {m.teamARoundWins || 0} - {m.teamBRoundWins || 0}
                        </div>
                        <span className="text-xs uppercase font-bold text-slate-400 font-mono">VS</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <h2 className="font-bold text-white text-base truncate font-['Teko',sans-serif] text-xl leading-none">
                          {teamB?.teamName || m.teamBId || 'Team B'}
                        </h2>
                        <span className="text-xs text-slate-300 font-mono">
                          {teamB?.teamTag ? `[${teamB.teamTag}]` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer / Scoring Action */}
                  <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {m.scheduledAt ? new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                    </span>

                    <div className="flex items-center gap-2">
                      {m.status === 'scheduled' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleStartMatchCountdown(m)}
                          className="text-xs bg-amber-600 hover:bg-amber-500 border-amber-500 font-bold"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          <span>Start Match</span>
                        </Button>
                      )}

                      {m.status === 'live' && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openScoringDialog(m)}
                            className="text-xs"
                          >
                            <Trophy className="w-3.5 h-3.5 text-amber-400 mr-1" />
                            <span>Score</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleEndMatch(m)}
                            className="text-xs bg-emerald-600 hover:bg-emerald-500 border-emerald-500 font-bold"
                          >
                            <Flag className="w-3 h-3 mr-1" />
                            <span>End Match</span>
                          </Button>
                        </>
                      )}

                      {m.status === 'done' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openScoringDialog(m)}
                          className="text-xs"
                        >
                          <Trophy className="w-3.5 h-3.5 text-amber-400 mr-1" />
                          <span>Edit Results</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </TiltCard>
            );
          })}
        </div>
      )}

      {/* Match Scoring Modal */}
      <Modal
        open={Boolean(scoringMatch)}
        onClose={() => setScoringMatch(null)}
        title="Record Match Results"
      >
        {scoringMatch && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  {teamMap.get(scoringMatch.teamAId)?.teamName || 'Team A'} Wins/Kills
                </label>
                <Input
                  type="number"
                  min={0}
                  value={teamARounds}
                  onChange={(e) => setTeamARounds(parseInt(e.target.value, 10) || 0)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  {teamMap.get(scoringMatch.teamBId)?.teamName || 'Team B'} Wins/Kills
                </label>
                <Input
                  type="number"
                  min={0}
                  value={teamBRounds}
                  onChange={(e) => setTeamBRounds(parseInt(e.target.value, 10) || 0)}
                />
              </div>
            </div>

            <div>
              <Select
                label="Match Progress Status"
                value={matchStatus}
                onChange={(val) => setMatchStatus(val as Match['status'])}
                options={[
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'live', label: 'Live In-Progress' },
                  { value: 'done', label: 'Match Completed (Finalized)' },
                ]}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <Button variant="secondary" size="sm" onClick={() => setScoringMatch(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveScore}
                disabled={isSaving}
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Commit Results'}</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Schedule Match Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Schedule New Tournament Match"
      >
        <div className="space-y-4">
          <div>
            <Select
              label="Select Squad A"
              value={newTeamA}
              onChange={setNewTeamA}
              options={[{ value: '', label: 'Select Squad...' }].concat(
                teams.map((t) => ({ value: t.id, label: t.teamName }))
              )}
            />
          </div>
          <div>
            <Select
              label="Select Squad B"
              value={newTeamB}
              onChange={setNewTeamB}
              options={[{ value: '', label: 'Select Squad...' }].concat(
                teams
                  .filter((t) => t.id !== newTeamA)
                  .map((t) => ({ value: t.id, label: t.teamName }))
              )}
            />
          </div>
          <div>
            <Select
              label="Battlefield Map"
              value={newMap}
              onChange={setNewMap}
              options={[
                { value: 'Erangel', label: 'Erangel (BGMI)' },
                { value: 'Miramar', label: 'Miramar (BGMI)' },
                { value: 'Bermuda Remastered', label: 'Bermuda (Free Fire)' },
                { value: 'Purgatory', label: 'Purgatory (Free Fire)' },
                { value: 'Nexterra', label: 'Nexterra (Free Fire)' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <Button variant="secondary" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateMatch}
              disabled={isSaving || !newTeamA || !newTeamB}
            >
              <span>Schedule Match</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* FEATURE 2: 30-Second Match Countdown Overlay */}
      {countdownMatch && (
        <MatchCountdown
          startedAt={countdownStartedAt}
          seconds={30}
          matchTitle={`${teamMap.get(countdownMatch.teamAId)?.teamName || 'Team A'} vs ${teamMap.get(countdownMatch.teamBId)?.teamName || 'Team B'}`}
          onComplete={handleCountdownFinished}
          onCancel={() => setCountdownMatch(null)}
        />
      )}
    </div>
  );
}
