import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { tournamentConverter } from '../lib/converters';
import { Tournament } from '../types/tournament';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { AwardBadges } from '../components/leaderboard/AwardBadges';
import { GlassCard } from '../components/ui/GlassCard';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { CANONICAL_GAMES } from '../lib/constants';
import { where } from 'firebase/firestore';
import { Icon } from '@iconify/react';

export const CSStandingsPage: React.FC = () => {
  const { gameId, setGameId } = useGame();
  const csConfig = CANONICAL_GAMES.FF_CS;

  const constraints = useMemo(() => [where('gameId', '==', 'FF_CS')], []);
  const { data: tournaments, loading: tLoading } = useFirestoreCollection<Tournament>(
    'tournaments',
    constraints,
    tournamentConverter
  );

  const [selectedTourneyId, setSelectedTourneyId] = useState<string>('');

  const activeTournament = useMemo(() => {
    if ((tournaments || []).length === 0) return null;
    if (selectedTourneyId) {
      const f = tournaments.find((t) => t.id === selectedTourneyId);
      if (f) return f;
    }
    return tournaments[0];
  }, [tournaments, selectedTourneyId]);

  const scoringSnapshot = useMemo(() => {
    return (
      activeTournament?.scoringSnapshot || {
        placementPoints: [],
        killPoints: 0,
        matchWinPoints: 1,
        mvpWeights: csConfig.mvpWeights,
      }
    );
  }, [activeTournament, csConfig]);

  const {
    standings,
    mvp,
    topFragger,
    loading: lLoading,
    lastUpdated,
  } = useLeaderboard({
    tournamentId: activeTournament?.id,
    gameId: 'FF_CS',
    scoringSnapshot,
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 text-left">
      {/* If current active game is NOT FF_CS, show prompt */}
      {gameId !== 'FF_CS' && (
        <GlassCard className="p-4 border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
            <Icon icon="solar:info-circle-bold" className="text-lg shrink-0 text-amber-500" />
            <span>
              You are currently browsing under <strong>{gameId}</strong> context. This page displays 4v4 Clash Squad round rankings.
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setGameId('FF_CS')}
            icon="solar:check-circle-bold"
            className="py-1 text-xs shrink-0"
          >
            Switch to Clash Squad
          </Button>
        </GlassCard>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Free Fire Clash Squad
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Clash Squad Standings & Round Diff
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ranked by match wins &bull; Round difference (Rounds Won - Lost) &bull; Rounds won tie-breaker.
          </p>
        </div>

        {tournaments.length > 0 && (
          <div className="w-full sm:w-64">
            <Select
              options={tournaments.map((t) => ({ value: t.id, label: t.name }))}
              value={activeTournament?.id || ''}
              onChange={(e) => setSelectedTourneyId(e.target.value)}
            />
          </div>
        )}
      </div>

      {tLoading ? (
        <Skeleton height={250} className="w-full" />
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon="solar:shield-bold"
          title="No Clash Squad Tournaments"
          description="There are currently no active Clash Squad tournaments registered. Create one in the Admin Console."
        />
      ) : (
        <>
          <AwardBadges
            mvp={mvp}
            topFragger={topFragger}
            scopeLabel={activeTournament?.name || 'Clash Squad'}
          />

          {lLoading ? (
            <Skeleton height={300} className="w-full" />
          ) : (
            <LeaderboardTable
              standings={standings}
              gameId="FF_CS"
              lastUpdated={lastUpdated}
            />
          )}
        </>
      )}
    </div>
  );
};
