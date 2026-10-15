import React, { useState, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  BarChart3,
  Trophy,
  Target,
  Flame,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Activity,
  Award,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/EmptyState';
import { AnalyticsSkeleton } from '../components/skeletons/AnalyticsSkeleton';
import { TagChip } from '../components/ui/TagChip';
import { CornerCaption } from '../components/ui/CornerCaption';
import { MorphTabs, type TabItem } from '../components/ui/MorphTabs';
import { StatCard } from '../components/ui/StatCard';
import { useTournament } from '../context/TournamentContext';
import { useGame } from '../context/GameContext';
import { useTeams, useMatches } from '../hooks/useFirestore';
import { getWinTerm } from '../lib/games';
import { cn } from '../lib/cn';
import type { LayoutContextType } from '../components/layout/Layout';
import type { Game, Team, Match } from '../types';

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
        <div className="p-8 text-center max-w-lg mx-auto my-12 bg-surface/85 backdrop-blur-xl rounded-[18px] border border-danger/30 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-danger/10 border border-danger/30 flex items-center justify-center text-danger mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-mono font-bold text-foreground uppercase">
            Telemetry Feed Disrupted
          </h2>
          <p className="text-muted text-xs leading-relaxed">
            {this.state.error?.message || 'Unable to render analytics components.'}
          </p>
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
            Reload Analytics
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Broadcast Noir Tournament Analytics Page.
 * Features:
 * - MorphTabs for time range selection.
 * - 4 Precision SVG charts re-themed with 6% opacity grid lines, mono axis labels, and accent gradients.
 * - Top-Fraggers ranked list with interactive kill bars.
 */
function AnalyticsContent({ propGame }: { propGame?: Game }) {
  const { currentGame } = useGame();
  const context = useOutletContext<LayoutContextType | null>();
  const { activeTournament } = useTournament();
  const game = propGame || currentGame || context?.game || activeTournament?.game || 'BGMI';
  const { teams, loading: teamsLoading, error: teamsError } = useTeams(activeTournament?.id);
  const { matches, loading: matchesLoading, error: matchesError } = useMatches(activeTournament?.id);

  const [timeRange, setTimeRange] = useState<string>('all');

  const loading = teamsLoading || matchesLoading;
  const error = teamsError || matchesError;

  const timeRangeTabs: TabItem[] = [
    { id: 'all', label: 'All Season' },
    { id: 'finals', label: 'Grand Finals' },
    { id: 'weekly', label: 'Last 7 Days' },
    { id: 'today', label: 'Live Day' },
  ];

  // Completed matches
  const completedMatches = useMemo(() => {
    return matches.filter((m) => m.status === 'Completed' || m.status === 'done');
  }, [matches]);

  // Total tournament combat kills
  const totalKills = useMemo(() => {
    return matches.reduce((acc, m) => {
      const matchKills = m.scores?.reduce((kAcc, s) => kAcc + (s.kills || 0), 0) || 0;
      return acc + matchKills;
    }, 0);
  }, [matches]);

  // Aggregate Top Fraggers
  const topFraggers = useMemo(() => {
    const map = new Map<string, { ign: string; teamName: string; kills: number; damage: number }>();

    teams.forEach((t) => {
      if (t.members) {
        t.members.forEach((m) => {
          const kills = m.kills || 0;
          const damage = m.damage || kills * 120;
          map.set(m.ign, {
            ign: m.ign,
            teamName: t.teamName,
            kills,
            damage,
          });
        });
      }
    });

    return Array.from(map.values())
      .sort((a, b) => b.kills - a.kills)
      .slice(0, 8);
  }, [teams]);

  const maxKills = Math.max(...topFraggers.map((f) => f.kills), 1);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-surface/85 backdrop-blur-xl rounded-[18px] border border-danger/30 max-w-lg mx-auto my-8 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-mono font-bold text-foreground uppercase">
          Unable to Load Analytics
        </h2>
        <p className="text-muted text-xs leading-relaxed">
          {error.message || 'A network error occurred while retrieving tournament data.'}
        </p>
        <Button variant="secondary" size="sm" onClick={() => window.location.reload()} className="text-xs">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>Reload Analytics</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 pb-12">
      {/* Pinned Corner Caption */}
      <CornerCaption position="top-right">
        TELEMETRY ENGINE // BROADCAST ANALYTICS
      </CornerCaption>

      {/* Broadcast Header */}
      <header className="relative overflow-hidden rounded-[20px] border border-border bg-surface/75 backdrop-blur-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <TagChip variant="accent">CIRCUIT TELEMETRY</TagChip>
              <TagChip variant="default">{game.toUpperCase()}</TagChip>
              <TagChip variant="muted">PHASE 02</TagChip>
            </div>
            <h1 className="font-mono text-2xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
              TOURNAMENT ANALYTICS
            </h1>
            <p className="font-sans text-xs sm:text-sm text-muted max-w-2xl">
              Real-time squad kill curves, damage attribution, placement matrices, and fragger efficiency ratings.
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="shrink-0">
            <MorphTabs
              tabs={timeRangeTabs}
              value={timeRange}
              onChange={setTimeRange}
              variant="segmented"
              density="compact"
              aria-label="Analytics Time Range Filter"
            />
          </div>
        </div>
      </header>

      {/* Telemetry Stat Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          variant="hero"
          label="REGISTERED SQUADS"
          value={teams.length}
          delta={{ value: '+4 slots', type: 'up' }}
          tag="ACTIVE"
        />
        <StatCard
          label="CONCLUDED FIXTURES"
          value={completedMatches.length}
          delta={{ value: `${matches.length} total`, type: 'neutral' }}
        />
        <StatCard
          label="COMBAT KILLS"
          value={totalKills}
          delta={{ value: '▲ 18.2/m', type: 'up' }}
        />
        <StatCard
          label="AVG SQUAD SURVIVAL"
          value="18m 42s"
          delta={{ value: 'Normative', type: 'neutral' }}
        />
      </section>

      {/* ━━━ FOUR RE-THEMED BROADCAST CHARTS ━━━ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CHART 1: Squad Placement & Point Distribution */}
        <div className="p-5 sm:p-6 rounded-[18px] border border-border bg-surface/75 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase text-foreground">
                Squad Placement & Kill Distribution
              </h3>
              <p className="font-sans text-[11px] text-muted">
                Point allocation ratio across top tier ranking squads
              </p>
            </div>
            <TagChip variant="accent">CHART 01</TagChip>
          </div>

          {/* SVG Bar Chart with 6% Grid Lines & Accent Gradients */}
          <div className="h-56 w-full relative flex flex-col justify-end">
            <svg className="w-full h-full" viewBox="0 0 400 180" fill="none">
              <defs>
                <linearGradient id="chartBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.15" />
                </linearGradient>
              </defs>

              {/* 6% Opacity Grid Lines */}
              {[30, 70, 110, 150].map((y) => (
                <line
                  key={y}
                  x1="30"
                  y1={y}
                  x2="390"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  className="text-foreground/[0.06]"
                />
              ))}

              {/* Monospace Y-Axis Labels */}
              <text x="5" y="34" className="font-mono text-[9px] fill-muted">80</text>
              <text x="5" y="74" className="font-mono text-[9px] fill-muted">50</text>
              <text x="5" y="114" className="font-mono text-[9px] fill-muted">25</text>
              <text x="5" y="154" className="font-mono text-[9px] fill-muted">0</text>

              {/* Data Bars */}
              {[
                { label: 'T1', h: 120, x: 50 },
                { label: 'T2', h: 95, x: 105 },
                { label: 'T3', h: 80, x: 160 },
                { label: 'T4', h: 65, x: 215 },
                { label: 'T5', h: 50, x: 270 },
                { label: 'T6', h: 38, x: 325 },
              ].map((bar, i) => (
                <g key={i}>
                  <rect
                    x={bar.x}
                    y={150 - bar.h}
                    width="32"
                    height={bar.h}
                    rx="4"
                    fill="url(#chartBarGrad)"
                    className="hover:opacity-90 transition-opacity"
                  />
                  <text
                    x={bar.x + 16}
                    y="166"
                    textAnchor="middle"
                    className="font-mono text-[10px] fill-muted"
                  >
                    {bar.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* CHART 2: Match Kill Velocity per Round */}
        <div className="p-5 sm:p-6 rounded-[18px] border border-border bg-surface/75 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase text-foreground">
                Match Kill Velocity Curve
              </h3>
              <p className="font-sans text-[11px] text-muted">
                Eliminations aggregated by tournament match round progression
              </p>
            </div>
            <TagChip variant="accent">CHART 02</TagChip>
          </div>

          {/* SVG Area Line Chart with 6% Grid Lines */}
          <div className="h-56 w-full relative flex flex-col justify-end">
            <svg className="w-full h-full" viewBox="0 0 400 180" fill="none">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#00D9FF" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* 6% Opacity Grid Lines */}
              {[30, 70, 110, 150].map((y) => (
                <line
                  key={y}
                  x1="30"
                  y1={y}
                  x2="390"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  className="text-foreground/[0.06]"
                />
              ))}

              {/* Area & Stroke Path */}
              <path
                d="M 50 120 Q 110 50, 170 85 T 290 40 T 370 70 L 370 150 L 50 150 Z"
                fill="url(#areaGrad)"
              />
              <path
                d="M 50 120 Q 110 50, 170 85 T 290 40 T 370 70"
                stroke="#00D9FF"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data points */}
              {[
                { cx: 50, cy: 120, label: 'M1' },
                { cx: 130, cy: 65, label: 'M2' },
                { cx: 210, cy: 85, label: 'M3' },
                { cx: 290, cy: 40, label: 'M4' },
                { cx: 370, cy: 70, label: 'M5' },
              ].map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.cx} cy={pt.cy} r="4" fill="#00D9FF" className="shadow-[0_0_8px_#00D9FF]" />
                  <text x={pt.cx} y="166" textAnchor="middle" className="font-mono text-[10px] fill-muted">
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* CHART 3: Survival vs Damage Efficiency */}
        <div className="p-5 sm:p-6 rounded-[18px] border border-border bg-surface/75 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase text-foreground">
                Survival Density vs Combat Rating
              </h3>
              <p className="font-sans text-[11px] text-muted">
                Squad average survival duration in minutes
              </p>
            </div>
            <TagChip variant="default">CHART 03</TagChip>
          </div>

          <div className="h-56 w-full relative flex flex-col justify-end">
            <svg className="w-full h-full" viewBox="0 0 400 180" fill="none">
              {[30, 70, 110, 150].map((y) => (
                <line
                  key={y}
                  x1="30"
                  y1={y}
                  x2="390"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  className="text-foreground/[0.06]"
                />
              ))}

              {/* Data points for squads */}
              {[
                { x: 60, y: 130, r: 6 },
                { x: 110, y: 90, r: 9 },
                { x: 160, y: 110, r: 7 },
                { x: 220, y: 60, r: 12 },
                { x: 280, y: 45, r: 14 },
                { x: 340, y: 35, r: 10 },
              ].map((c, i) => (
                <circle
                  key={i}
                  cx={c.x}
                  cy={c.y}
                  r={c.r}
                  fill="var(--accent)"
                  fillOpacity="0.6"
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* CHART 4: Top Fraggers Ranked List with Kill Bars */}
        <div className="p-5 sm:p-6 rounded-[18px] border border-border bg-surface/75 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase text-foreground">
                Top Fraggers Leaderboard
              </h3>
              <p className="font-sans text-[11px] text-muted">
                Player combat kill counts and proportional performance bars
              </p>
            </div>
            <TagChip variant="accent">CHART 04</TagChip>
          </div>

          <div className="space-y-3 font-mono">
            {topFraggers.length === 0 ? (
              <p className="text-muted text-xs">No fragger records registered yet.</p>
            ) : (
              topFraggers.map((fragger, idx) => {
                const widthPercent = Math.round((fragger.kills / maxKills) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-muted font-bold w-5">{idx + 1}.</span>
                        <span className="font-bold text-foreground truncate max-w-[120px]">
                          {fragger.ign}
                        </span>
                        <span className="text-[10px] text-muted truncate max-w-[100px]">
                          ({fragger.teamName})
                        </span>
                      </div>
                      <span className="font-bold text-accent tabular-nums">
                        {fragger.kills} KILLS
                      </span>
                    </div>

                    {/* Kill Bar with Accent Gradient */}
                    <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden border border-border/40">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent/50 to-accent transition-all duration-500"
                        style={{ width: `${Math.max(widthPercent, 8)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
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
