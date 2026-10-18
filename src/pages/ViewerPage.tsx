import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { tournamentConverter } from '../lib/converters';
import { Tournament } from '../types/tournament';
import { GameId } from '../types/game';
import { CANONICAL_GAMES } from '../lib/constants';
import { Icon } from '@iconify/react';

export const ViewerPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const gameParam = searchParams.get('game') as GameId | null;
  const tourneyParam = searchParams.get('tournament');

  const gameId: GameId =
    gameParam === 'BGMI' || gameParam === 'FF_BR' || gameParam === 'FF_CS'
      ? gameParam
      : 'BGMI';

  const gameConfig = CANONICAL_GAMES[gameId];

  // Load tournament doc
  const { data: tournament, loading: tLoading } = useFirestoreDoc<Tournament>(
    tourneyParam ? `tournaments/${tourneyParam}` : '',
    tournamentConverter
  );

  const scoringSnapshot = useMemo(() => {
    return (
      tournament?.scoringSnapshot || {
        placementPoints: gameConfig.placementPoints,
        killPoints: gameConfig.killPoints,
        matchWinPoints: gameConfig.matchWinPoints ?? 1,
        mvpWeights: gameConfig.mvpWeights,
      }
    );
  }, [tournament, gameConfig]);

  const { standings, matches, mvp, topFragger } = useLeaderboard({
    tournamentId: tournament?.id,
    gameId,
    scoringSnapshot,
  });

  const latestCompletedMatch = useMemo(() => {
    return [...(matches || [])]
      .filter((m) => m?.status === 'completed')
      .sort((a, b) => (b.matchNumber ?? 0) - (a.matchNumber ?? 0))[0];
  }, [matches]);

  const liveMatch = useMemo(() => {
    return (matches || []).find((m) => m?.status === 'live');
  }, [matches]);

  if (!tourneyParam) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-black/90 text-white font-mono">
        <div className="text-center space-y-2 border border-white/20 p-8 rounded-2xl bg-black/60 max-w-lg">
          <Icon icon="solar:videocamera-record-bold" className="text-4xl text-rose-500 mx-auto animate-pulse" />
          <h2 className="text-2xl font-black">OBS Broadcast Overlay</h2>
          <p className="text-xs text-slate-400">
            Missing URL parameter. Use <code className="bg-white/10 px-1 py-0.5 rounded">?game=BGMI&tournament=&lt;ID&gt;</code> to attach to a tournament stream.
          </p>
        </div>
      </div>
    );
  }

  if (tLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/95 text-white font-mono">
        <div className="flex items-center gap-3">
          <Icon icon="solar:refresh-circle-bold" className="text-3xl text-brand-500 animate-spin" />
          <span className="text-sm uppercase tracking-widest font-bold">Connecting OBS Feed...</span>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-black/95 text-white font-mono">
        <div className="text-center space-y-2 border border-white/20 p-8 rounded-2xl bg-black/60">
          <Icon icon="solar:danger-triangle-bold" className="text-4xl text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold">Tournament Not Found or Unpublished</h2>
          <p className="text-xs text-slate-400">Target tournament does not exist in the database.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10 bg-black/95 text-white font-sans selection:bg-brand-500 selection:text-white flex flex-col justify-between">
      {/* OBS Top Broadcast Header */}
      <div className="flex items-center justify-between border-b-2 border-brand-500/40 pb-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg">
            <Icon icon="solar:cup-star-bold" className="text-2xl" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/40 text-[10px] font-black uppercase tracking-widest">
                {gameConfig.name}
              </span>
              {liveMatch && (
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest animate-pulse flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                  MATCH #{liveMatch.matchNumber} LIVE &bull; {liveMatch.map}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-white mt-1">
              {tournament.name}
            </h1>
          </div>
        </div>

        {/* Match Ticker */}
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
            Status
          </span>
          <span className="font-mono text-base font-extrabold text-brand-400">
            {latestCompletedMatch
              ? `After Match #${latestCompletedMatch.matchNumber} (${latestCompletedMatch.map})`
              : 'Awaiting Match #1'}
          </span>
        </div>
      </div>

      {/* Main High-Contrast OBS Leaderboard Grid */}
      <div className="flex-1 my-auto">
        <div className="overflow-hidden rounded-2xl border border-white/20 bg-black/75 shadow-2xl backdrop-blur-xl">
          <table className="w-full text-left text-sm font-semibold">
            <thead>
              <tr className="border-b border-white/20 bg-white/10 text-xs font-black uppercase tracking-wider text-slate-300">
                <th className="py-3 px-4 text-center w-14">#</th>
                <th className="py-3 px-4">Squad Name</th>
                <th className="py-3 px-4 text-center">Matches</th>
                {gameId !== 'FF_CS' ? (
                  <>
                    <th className="py-3 px-4 text-center">Place Pts</th>
                    <th className="py-3 px-4 text-center">Kill Pts</th>
                    <th className="py-3 px-4 text-center">WWCD</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-4 text-center">Wins</th>
                    <th className="py-3 px-4 text-center">Round Diff</th>
                    <th className="py-3 px-4 text-center">Rounds Won</th>
                  </>
                )}
                <th className="py-3 px-4 text-right">Total Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 font-mono">
              {(standings || []).slice(0, 16).map((row) => {
                const isFirst = row.rank === 1;
                return (
                  <tr
                    key={row.teamId}
                    className={`transition-colors ${
                      isFirst
                        ? 'bg-amber-500/20 text-white font-extrabold'
                        : 'hover:bg-white/5 text-slate-200'
                    }`}
                  >
                    <td className="py-2.5 px-4 text-center">
                      {row.rank === 1 ? (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-black font-black text-sm">
                          1
                        </span>
                      ) : row.rank === 2 ? (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-300 text-black font-black text-sm">
                          2
                        </span>
                      ) : row.rank === 3 ? (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-700 text-white font-black text-sm">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">{row.rank}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-sans font-black text-base tracking-tight text-white">
                      {row.teamName}
                    </td>
                    <td className="py-2.5 px-4 text-center text-slate-300">
                      {row.matchesPlayed}
                    </td>
                    {gameId !== 'FF_CS' ? (
                      <>
                        <td className="py-2.5 px-4 text-center text-slate-300">
                          {row.placementPoints}
                        </td>
                        <td className="py-2.5 px-4 text-center text-rose-400 font-bold">
                          {row.killPoints}
                        </td>
                        <td className="py-2.5 px-4 text-center text-amber-400 font-bold">
                          {row.wwcdCount > 0 ? `🏆 ${row.wwcdCount}` : '-'}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">
                          {row.matchWins ?? 0}
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold">
                          {(row.roundDifference ?? 0) > 0
                            ? `+${row.roundDifference}`
                            : row.roundDifference ?? 0}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-300">
                          {row.roundsWon ?? 0}
                        </td>
                      </>
                    )}
                    <td className="py-2.5 px-4 text-right font-black text-lg text-brand-400">
                      {row.totalPoints}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* OBS Bottom Awards Ticker */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mvp && (
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-500/40 bg-black/80">
            <div className="flex items-center gap-2.5">
              <Icon icon="solar:crown-star-bold" className="text-2xl text-amber-500" />
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                  Tournament MVP ({mvp.scope})
                </span>
                <span className="text-base font-black text-white">{mvp.playerName}</span>
                <span className="text-xs text-slate-400 ml-2">({mvp.teamName})</span>
              </div>
            </div>
            <span className="font-mono text-lg font-black text-amber-400">{mvp.score.toFixed(1)} PTS</span>
          </div>
        )}

        {topFragger && (
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-rose-500/40 bg-black/80">
            <div className="flex items-center gap-2.5">
              <Icon icon="solar:target-bold" className="text-2xl text-rose-500" />
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider">
                  Top Fragger ({topFragger.scope})
                </span>
                <span className="text-base font-black text-white">{topFragger.playerName}</span>
                <span className="text-xs text-slate-400 ml-2">({topFragger.teamName})</span>
              </div>
            </div>
            <span className="font-mono text-lg font-black text-rose-400">{topFragger.score} KILLS</span>
          </div>
        )}
      </div>
    </div>
  );
};
