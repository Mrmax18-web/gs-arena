import React, { useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { tournamentConverter, matchConverter } from '../lib/converters';
import { Match, Tournament, TournamentAnalyticsData } from '../types/tournament';
import { GlassCard } from '../components/ui/GlassCard';
import { Select } from '../components/ui/Select';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { where } from 'firebase/firestore';
import { Icon } from '@iconify/react';

export const AnalyticsPage: React.FC = () => {
  const { gameId, game } = useGame();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTournamentId = searchParams.get('t') || '';

  // 1. Load tournaments matching active game
  const tourneyConstraints = useMemo(() => [where('gameId', '==', gameId)], [gameId]);
  const {
    data: tournaments,
    loading: tLoading,
    error: tError,
    refetch: refetchTournaments,
  } = useFirestoreCollection<Tournament>('tournaments', tourneyConstraints, tournamentConverter);

  const activeTournament = useMemo(() => {
    if ((tournaments || []).length === 0) return null;
    if (urlTournamentId) {
      const f = tournaments.find((t) => t.id === urlTournamentId);
      if (f) return f;
    }
    const live = tournaments.find((t) => t.status === 'live');
    return live || tournaments[0];
  }, [tournaments, urlTournamentId]);

  // Sync active tournament back into URL ?t=id
  useEffect(() => {
    if (activeTournament && urlTournamentId !== activeTournament.id) {
      setSearchParams({ t: activeTournament.id }, { replace: true });
    }
  }, [activeTournament, urlTournamentId, setSearchParams]);

  // 2. Read from sanitized public collection: /publicAnalytics/{tid} (Public read, ZERO PII)
  const publicAnalyticsPath = activeTournament ? `publicAnalytics/${activeTournament.id}` : '';
  const {
    data: publicAnalyticsDoc,
    loading: paLoading,
    error: paError,
  } = useFirestoreDoc<TournamentAnalyticsData>(publicAnalyticsPath);

  // 3. Fallback: also listen to public matches subcollection in case publicAnalytics document is pending sync
  const { data: rawMatches, loading: mLoading } = useFirestoreCollection<Match>(
    activeTournament ? `tournaments/${activeTournament.id}/matches` : '',
    [],
    matchConverter
  );

  // Compute stats if publicAnalytics doc is not yet present
  const resolvedAnalytics = useMemo(() => {
    if (publicAnalyticsDoc && publicAnalyticsDoc.teamKills && publicAnalyticsDoc.teamKills.length > 0) {
      return {
        teamKills: publicAnalyticsDoc.teamKills,
        playerKills: publicAnalyticsDoc.playerKills || [],
        matchesCount: Math.max(...publicAnalyticsDoc.teamKills.map((t) => t.matchesPlayed || 0), 0),
      };
    }

    // Dynamic aggregation from public matches
    const completed = (rawMatches || []).filter((m) => m?.status === 'completed' && m.results);
    const teamMap = new Map<string, { teamId: string; teamName: string; totalKills: number; matchesPlayed: number }>();
    const playerMap = new Map<string, { playerId: string; playerName: string; teamName: string; kills: number; damage: number; matchesPlayed: number }>();

    for (const match of completed) {
      for (const res of (match.results || [])) {
        if (!res?.teamId) continue;
        const derivedKills = Array.isArray(res.playerStats) && res.playerStats.length > 0
          ? res.playerStats.reduce((sum, p) => sum + (p?.kills ?? 0), 0)
          : (res.kills ?? 0);

        const existingTeam = teamMap.get(res.teamId) ?? {
          teamId: res.teamId,
          teamName: res.teamName || 'Unknown Team',
          totalKills: 0,
          matchesPlayed: 0,
        };
        existingTeam.totalKills += derivedKills;
        existingTeam.matchesPlayed += 1;
        teamMap.set(res.teamId, existingTeam);

        for (const p of (res.playerStats || [])) {
          if (!p || !p.playerName) continue;
          const key = p.playerId || p.playerName;
          const existingPlayer = playerMap.get(key) ?? {
            playerId: key,
            playerName: p.playerName,
            teamName: res.teamName || 'Unknown Team',
            kills: 0,
            damage: 0,
            matchesPlayed: 0,
          };
          existingPlayer.kills += (p.kills ?? 0);
          existingPlayer.damage += (p.damage ?? 0);
          existingPlayer.matchesPlayed += 1;
          playerMap.set(key, existingPlayer);
        }
      }
    }

    return {
      teamKills: Array.from(teamMap.values()).sort((a, b) => b.totalKills - a.totalKills),
      playerKills: Array.from(playerMap.values()).sort((a, b) => b.kills - a.kills),
      matchesCount: completed.length,
    };
  }, [publicAnalyticsDoc, rawMatches]);

  const totalTournamentKills = useMemo(() => {
    return (resolvedAnalytics.teamKills || []).reduce((sum, t) => sum + (t.totalKills || 0), 0);
  }, [resolvedAnalytics.teamKills]);

  const tournamentOptions = useMemo(() => {
    return (tournaments || []).map((t) => ({
      value: t.id,
      label: `${t.name} (${t.status.toUpperCase()})`,
    }));
  }, [tournaments]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 text-left">
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
            Public Tournament Analytics
          </h2>
          {activeTournament && (
            <p className="text-xs text-brand-500 dark:text-brand-400 font-bold mt-0.5">
              Active Tournament: {activeTournament.name}
            </p>
          )}
        </div>

        {tournaments.length > 0 && (
          <div className="w-full sm:w-64">
            <Select
              options={tournamentOptions}
              value={activeTournament?.id || ''}
              onChange={(e) => setSearchParams({ t: e.target.value })}
            />
          </div>
        )}
      </div>

      {tLoading ? (
        <div className="space-y-4">
          <Skeleton height={100} className="w-full" />
          <Skeleton height={250} className="w-full" />
        </div>
      ) : tError ? (
        <ErrorState
          title="Failed to Load Tournaments"
          description={tError.message}
          onRetry={refetchTournaments}
        />
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon="solar:chart-2-bold"
          title="No Tournaments Configured"
          description={`There are currently no active tournaments for ${game.name}.`}
        />
      ) : paLoading && mLoading ? (
        <div className="space-y-4">
          <Skeleton height={100} className="w-full" />
          <Skeleton height={300} className="w-full" />
        </div>
      ) : paError && !rawMatches.length ? (
        <ErrorState
          title="Analytics Unavailable"
          description={paError.message || 'Unable to retrieve public analytics.'}
        />
      ) : (resolvedAnalytics.teamKills.length === 0 && resolvedAnalytics.playerKills.length === 0) ? (
        <EmptyState
          icon="solar:chart-2-bold"
          title="No Completed Matches Yet"
          description={`No match kills recorded yet for ${activeTournament?.name || 'this tournament'}. Statistics update automatically when referees submit match results.`}
        />
      ) : (
        <div className="space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <GlassCard className="p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Matches Recorded
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
                {resolvedAnalytics.matchesCount}
              </span>
            </GlassCard>

            <GlassCard className="p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Total Tournament Kills
              </span>
              <span className="text-2xl font-black text-rose-500 font-mono mt-1 block">
                {totalTournamentKills}
              </span>
            </GlassCard>

            <GlassCard className="p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Competing Teams
              </span>
              <span className="text-2xl font-black text-brand-500 font-mono mt-1 block">
                {resolvedAnalytics.teamKills.length}
              </span>
            </GlassCard>

            <GlassCard className="p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Tracked Players
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
                {resolvedAnalytics.playerKills.length}
              </span>
            </GlassCard>
          </div>

          {/* 1. Per-Team Total Kills Table */}
          <GlassCard strong className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
              <Icon icon="solar:shield-bold" className="text-xl text-amber-500" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Per-Team Total Kills
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 uppercase font-semibold text-[10px]">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Team Name</th>
                    <th className="py-2 px-3 text-center">Matches</th>
                    <th className="py-2 px-3 text-center">Kill Share</th>
                    <th className="py-2 px-3 text-right">Total Kills</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {resolvedAnalytics.teamKills.map((team, idx) => {
                    const pct = totalTournamentKills > 0
                      ? Math.round((team.totalKills / totalTournamentKills) * 100)
                      : 0;

                    return (
                      <tr key={team.teamId || idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-400">#{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{team.teamName}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{team.matchesPlayed}</td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-[10px] font-bold">
                            {pct}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-rose-500">
                          {team.totalKills}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* 2. Per-Player Kills Leaderboard */}
          <GlassCard strong className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
              <Icon icon="solar:target-bold" className="text-xl text-rose-500" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Per-Player Kills (Fraggers)
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 uppercase font-semibold text-[10px]">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Player Name</th>
                    <th className="py-2 px-3">Team</th>
                    <th className="py-2 px-3 text-center">Matches</th>
                    <th className="py-2 px-3 text-right">Kills</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {resolvedAnalytics.playerKills.slice(0, 20).map((player, idx) => (
                    <tr key={player.playerId || idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">#{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{player.playerName}</td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{player.teamName}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{player.matchesPlayed}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-rose-500">
                        {player.kills}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
