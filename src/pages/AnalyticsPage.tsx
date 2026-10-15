import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { BarChart3, Trophy, Target, Flame, AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/EmptyState';
import { AnalyticsSkeleton } from '../components/skeletons/AnalyticsSkeleton';
import { useTournament } from '../context/TournamentContext';
import { useGame } from '../context/GameContext';
import { useTeams, useMatches } from '../hooks/useFirestore';
import { getWinTerm } from '../lib/games';
import type { LayoutContextType } from '../components/layout/Layout';
import type { Game } from '../types';

interface AnalyticsErrorBoundaryProps {
  children: React.ReactNode;
}

interface AnalyticsErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AnalyticsErrorBoundary extends React.Component<
  AnalyticsErrorBoundaryProps,
  AnalyticsErrorBoundaryState
> {
  constructor(props: AnalyticsErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AnalyticsErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center max-w-lg mx-auto my-12 bg-black/60 rounded-2xl border border-rose-500/20 space-y-4">
          <h2 className="text-3xl font-bold text-white font-['Teko',sans-serif]">Something went wrong</h2>
          <p className="text-slate-300 text-sm mt-2">{this.state.error?.message || 'Unable to render analytics components.'}</p>
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
            Reload Analytics
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AnalyticsContent({ propGame }: { propGame?: Game }) {
  const { currentGame } = useGame();
  const context = useOutletContext<LayoutContextType | null>();
  const { activeTournament } = useTournament();
  const game = propGame || currentGame || context?.game || activeTournament?.game || 'BGMI';
  const { data: teams, loading: teamsLoading, error: teamsError } = useTeams(activeTournament?.id);
  const { data: matches, loading: matchesLoading, error: matchesError } = useMatches(activeTournament?.id);

  const loading = teamsLoading || matchesLoading;
  const error = teamsError || matchesError;

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-black/60 rounded-2xl border border-rose-500/20 max-w-lg mx-auto my-8 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white font-['Teko',sans-serif] text-2xl">
          Unable to Load Analytics
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          {error.message || 'A network error occurred while retrieving tournament data.'}
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.location.reload()}
          className="text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>Reload Analytics</span>
        </Button>
      </div>
    );
  }

  const completedMatches = matches.filter((m) => m.status === 'done');

  return (
    <div className="space-y-8">
      {/* Page Header with ambient game image backdrop */}
      <header className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={game === 'BGMI' ? '/bgmi-icon.png' : '/freefire-icon.png'}
            alt=""
            role="presentation"
            className="w-full h-full object-cover opacity-20"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div
            className={`absolute inset-0 ${
              game === 'BGMI'
                ? 'bg-gradient-to-r from-orange-950/80 via-black/90 to-[#03040a]'
                : 'bg-gradient-to-r from-red-950/80 via-black/90 to-[#03040a]'
            }`}
          />
        </div>

        <div className="relative z-10 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-extrabold tracking-widest px-2.5 py-0.5 rounded bg-orange-500/20 text-amber-300 border border-orange-500/30">
                {game}
              </span>
              <span className="text-xs text-slate-300 font-mono">Deep Metrics</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3 font-['Teko',sans-serif]">
              <BarChart3 className="w-8 h-8 text-blue-400" />
              Tournament Analytics
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Squad kill curves, win rates, map survival stats, and {getWinTerm(game).plural} distributions across the active season.
            </p>
          </div>
        </div>
      </header>

      {teams.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="w-8 h-8 text-blue-400" />}
          title="No Analytics Data Available"
          description="Analytics will automatically compute once teams register and tournament matches are completed."
          action={
            <Link
              to="/register"
              className="text-sm text-amber-300 hover:text-amber-200 font-semibold underline underline-offset-2"
            >
              Register a squad to get started →
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Section 1: Team Performance */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white font-['Teko',sans-serif] tracking-wide flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-300" />
              Team Performance
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5 flex flex-col justify-between bg-black/40 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Registered Squads
                  </span>
                  <Trophy className="w-5 h-5 text-amber-300" />
                </div>
                <div className="text-3xl font-black font-mono text-white">
                  {teams.length}
                </div>
                <span className="text-xs text-slate-300 mt-2 font-mono">Active slots in tournament</span>
              </Card>

              <Card className="p-5 flex flex-col justify-between bg-black/40 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Matches Concluded
                  </span>
                  <Target className="w-5 h-5 text-rose-400" />
                </div>
                <div className="text-3xl font-black font-mono text-white">
                  {completedMatches.length}
                </div>
                <span className="text-xs text-slate-300 mt-2 font-mono">Finalized scorecards</span>
              </Card>

              <Card className="p-5 flex flex-col justify-between bg-black/40 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Total Rounds Played
                  </span>
                  <Flame className="w-5 h-5 text-amber-300" />
                </div>
                <div className="text-3xl font-black font-mono text-white">
                  {completedMatches.reduce(
                    (sum, m) => sum + (m.teamARoundWins || 0) + (m.teamBRoundWins || 0),
                    0
                  )}
                </div>
                <span className="text-xs text-slate-300 mt-2 font-mono">Live combat rounds</span>
              </Card>
            </div>
          </section>

          {/* Section 2: Player Statistics */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white font-['Teko',sans-serif] tracking-wide flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Player Statistics
            </h2>

            <Card className="p-6 bg-black/40 border border-white/10">
              <p className="text-sm text-slate-300 leading-relaxed">
                Detailed player kill/death ratios, average combat damage (ADR), and headshot percentages are aggregated across all recorded match scorecards.
              </p>
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-slate-300 font-mono">
                <div>Total Tracked Teams: <strong className="text-white">{teams.length}</strong></div>
                <div>Completed Fixtures: <strong className="text-white">{completedMatches.length}</strong></div>
                <div>Tournament Circuit: <strong className="text-amber-300">{game}</strong></div>
              </div>
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}

export function AnalyticsPage({ propGame }: { propGame?: Game } = {}) {
  return (
    <AnalyticsErrorBoundary>
      <AnalyticsContent propGame={propGame} />
    </AnalyticsErrorBoundary>
  );
}
