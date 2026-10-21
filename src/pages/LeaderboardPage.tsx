import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { tournamentConverter } from '../lib/converters';
import { Tournament } from '../types/tournament';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { AwardBadges } from '../components/leaderboard/AwardBadges';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { Select } from '../components/ui/Select';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Button } from '../components/ui/Button';
import { where, limit } from 'firebase/firestore';

export const LeaderboardPage: React.FC = () => {
  const { gameId, game } = useGame();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTournamentId = searchParams.get('t') || '';

  // Load tournaments matching active game with limit
  const constraints = useMemo(() => [where('gameId', '==', gameId), limit(50)], [gameId]);
  const {
    data: tournaments,
    loading: tournamentsLoading,
    error: tourneyError,
    refetch: refetchTournaments,
  } = useFirestoreCollection<Tournament>('tournaments', constraints, tournamentConverter);

  const [topLimit, setTopLimit] = useState<5 | 10>(5);

  // Auto-select tournament: URL ?t=id -> live -> first
  const activeTournament = useMemo(() => {
    if ((tournaments || []).length === 0) return null;
    if (urlTournamentId) {
      const match = tournaments.find((t) => t.id === urlTournamentId);
      if (match) return match;
    }
    const live = tournaments.find((t) => t.status === 'live');
    return live || tournaments[0];
  }, [tournaments, urlTournamentId]);

  // Sync active tournament back to URL ?t=id if different
  useEffect(() => {
    if (activeTournament && urlTournamentId !== activeTournament.id) {
      setSearchParams({ t: activeTournament.id }, { replace: true });
    }
  }, [activeTournament, urlTournamentId, setSearchParams]);

  const scoringSnapshot = useMemo(() => {
    if (activeTournament?.scoringSnapshot) {
      return activeTournament.scoringSnapshot;
    }
    return {
      placementPoints: game.placementPoints,
      killPoints: game.killPoints,
      matchWinPoints: game.matchWinPoints ?? 1,
      mvpWeights: game.mvpWeights,
    };
  }, [activeTournament, game]);

  const {
    standings,
    matches,
    mvp,
    topFragger,
    loading: leaderboardLoading,
    error: leaderboardError,
    lastUpdated,
  } = useLeaderboard({
    tournamentId: activeTournament?.id,
    gameId,
    scoringSnapshot,
  });

  const tournamentOptions = useMemo(() => {
    return (tournaments || []).map((t) => ({
      value: t.id,
      label: `${t.name} (${t.status.toUpperCase()})`,
    }));
  }, [tournaments]);

  // Limit standings to Top 5 (or max 10)
  const displayedStandings = useMemo(() => {
    return (standings || []).slice(0, topLimit);
  }, [standings, topLimit]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Page Title & Tournament Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              {game.name}
            </span>
            <span className="text-xs font-medium text-slate-400">&bull; Mode: {game.mode}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Leaderboard & Standings
          </h2>
          {activeTournament && (
            <p className="text-xs text-brand-500 dark:text-brand-400 font-bold mt-0.5">
              Active Tournament: {activeTournament.name}
            </p>
          )}
        </div>

        {/* Tournament Switcher */}
        {tournaments.length > 0 && (
          <div className="w-full sm:w-72">
            <Select
              options={tournamentOptions}
              value={activeTournament?.id || ''}
              onChange={(e) => setSearchParams({ t: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Loading State */}
      {tournamentsLoading ? (
        <div className="space-y-4">
          <Skeleton height={140} className="w-full" />
          <Skeleton height={320} className="w-full" />
        </div>
      ) : tourneyError ? (
        <ErrorState
          title="Failed to Load Tournaments"
          description={tourneyError.message}
          onRetry={refetchTournaments}
        />
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon="solar:cup-bold"
          title="No Tournaments Active"
          description={`There are currently no tournaments configured for ${game.name}. Admins can create one in the Admin Panel.`}
          action={
            <Button variant="primary" size="sm" onClick={() => navigate('/admin')}>
              Open Admin Panel
            </Button>
          }
        />
      ) : (
        <>
          {/* Active Tournament Status Banner */}
          {activeTournament && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl glass border border-slate-200 dark:border-white/10 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {activeTournament.name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                    activeTournament.status === 'live'
                      ? 'bg-rose-500/20 text-rose-500 animate-pulse'
                      : activeTournament.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-500'
                  }`}
                >
                  {activeTournament.status}
                </span>
                <span className="text-slate-400">
                  Matches Completed: <strong>{(matches || []).filter((m) => m?.status === 'completed').length}</strong>
                </span>
              </div>

              {activeTournament.registrationOpen && (
                <Button
                  variant="glass"
                  size="sm"
                  icon="solar:user-plus-bold"
                  onClick={() => navigate(`/registration?t=${activeTournament.id}`)}
                  className="py-1 text-xs"
                >
                  Register Team
                </Button>
              )}
            </div>
          )}

          {/* MVP Block on TOP */}
          <AwardBadges
            mvp={mvp}
            topFragger={topFragger}
            scopeLabel={activeTournament?.name || 'Tournament'}
          />

          {/* Top 5 / Top 10 Switcher Filter */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Standings Rank ({displayedStandings.length} of {standings.length} Teams)
            </span>
            <div className="flex items-center gap-1.5 p-1 rounded-xl glass border border-slate-200 dark:border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setTopLimit(5)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  topLimit === 5
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Top 5
              </button>
              <button
                type="button"
                onClick={() => setTopLimit(10)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  topLimit === 10
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Top 10
              </button>
            </div>
          </div>

          {/* Leaderboard Table */}
          {leaderboardLoading ? (
            <Skeleton height={300} className="w-full" />
          ) : leaderboardError ? (
            <ErrorState title="Leaderboard Query Error" description={leaderboardError.message} />
          ) : (
            <LeaderboardTable
              standings={displayedStandings}
              gameId={gameId}
              lastUpdated={lastUpdated}
            />
          )}
        </>
      )}
    </div>
  );
};

export default LeaderboardPage;

