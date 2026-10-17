import React, { useMemo, useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Trophy,
  Flame,
  Download,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Shield,
  Crown,
  Target,
  Search,
  Timer,
  Activity,
  Users,
} from 'lucide-react';
import type { LayoutContextType } from '../components/layout/Layout';
import { useTournament } from '../context/TournamentContext';
import { useGame } from '../context/GameContext';
import { useTeams, useMatches } from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';
import { Podium, type PodiumTeam } from '../components/Podium';
import { EmptyPodium } from '../components/EmptyPodium';
import { EmptyState } from '../components/EmptyState';
import { StatCard } from '../components/ui/StatCard';
import { TagChip } from '../components/ui/TagChip';
import { LiveBadge } from '../components/ui/LiveBadge';
import { CornerCaption } from '../components/ui/CornerCaption';
import { MorphTabs, type TabItem } from '../components/ui/MorphTabs';
import { OrbitCoreIcon } from '../components/ui/OrbitCoreIcon';
import { Button } from '../components/ui/Button';
import { exportToCSV, exportToExcel } from '../lib/exportUtils';
import { getWinTerm } from '../lib/games';
import { cn } from '../lib/cn';
import type { Team, Game, Member, Match } from '../types';

interface MatchScore {
  teamId: string;
  placement?: number;
  kills?: number;
  placementPoints?: number;
}

interface LeaderboardMatch extends Match {
  scores?: MatchScore[];
}

interface TeamMemberWithStats extends Member {
  role?: 'IGL' | 'Assaulter' | 'Sniper' | 'Support';
  kills?: number;
  damage?: number;
  survivalSeconds?: number;
}

interface LeaderboardTeam extends Team {
  status?: string;
  members?: TeamMemberWithStats[];
  matchesPlayed?: number;
}

interface TeamScoreRow {
  team: LeaderboardTeam;
  matchesPlayed: number;
  wwcds: number;
  killPoints: number;
  placementPoints: number;
  totalPoints: number;
  rankDelta?: number;
}

export interface PlayerMVP {
  id: string;
  gameUid: string;
  ign: string;
  displayName: string;
  teamId: string;
  teamName: string;
  teamTag?: string;
  teamLogo?: string;
  role: 'IGL' | 'Assaulter' | 'Sniper' | 'Support';
  isCaptain: boolean;
  matchesPlayed: number;
  kills: number;
  survivalSeconds: number;
  avgSurvivalFormatted: string;
  damage: number;
  mvpScore: number;
}

export interface LeaderboardPageProps {
  propGame?: Game;
}

/**
 * Flagship AAA Broadcast Noir Leaderboard.
 * Features:
 * - Broadcast Hero with 64-96px monospace tournament title, TagChips, LiveBadge, tabular countdown,
 *   and 160px interactive 3D Orbit Core icon.
 * - Scoreboard Table with sticky header, 40px mono ranks, team logos, WWCD pips,
 *   placement/kill points, bold tabular totals, delta arrows, and top-3 edge-lit rails.
 * - Interactive row expansion revealing match telemetry breakdown.
 * - Metallic 3D Podium and MVP player spotlight.
 */
export function LeaderboardPage({ propGame }: LeaderboardPageProps = {}) {
  const { currentGame, currentMode, setCurrentMode } = useGame();
  const context = useOutletContext<LayoutContextType | null>();
  const { activeTournament, tournaments, setActiveTournament } = useTournament();
  const game = propGame || currentGame || context?.game || activeTournament?.game || 'BGMI';
  const { user, isAdmin, signIn } = useAuth();
  const win = getWinTerm(game);

    // Synchronize active tournament with selected mode when playing Free Fire
  useEffect(() => {
    if (game === 'Free Fire' && activeTournament && activeTournament.mode !== currentMode) {
      const matchTourney = (tournaments ?? []).find((t) => t.game === 'Free Fire' && t.mode === currentMode);
      if (matchTourney) {
        setActiveTournament(matchTourney);
      } else {
        setActiveTournament({
          id: `free-fire-${currentMode.toLowerCase()}-championship-s1`,
          game: 'Free Fire',
          name: `Free Fire ${currentMode === 'CS' ? 'Clash Squad' : 'Battle Royale'} Championship`,
          startDate: '',
          endDate: '',
          numMatches: 0,
          status: 'Open',
          mode: currentMode,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }, [game, currentMode, activeTournament, tournaments, setActiveTournament]);

  const { data: rawTeams, teams = rawTeams ?? [], loading: teamsLoading } = useTeams(activeTournament?.id);
  const { data: rawMatches, matches = rawMatches ?? [], loading: matchesLoading } = useMatches(activeTournament?.id);

  const typedTeams = (teams as unknown as LeaderboardTeam[]) ?? [];
  const typedMatches = (matches as unknown as LeaderboardMatch[]) ?? [];

  const [activeViewTab, setActiveViewTab] = useState<string>('standings');
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [mvpSortBy, setMvpSortBy] = useState<'mvpScore' | 'kills' | 'survival'>('mvpScore');
  const [showAll, setShowAll] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  // Live match detection
  const isMatchLive = useMemo(() => {
    return typedMatches.some(
      (m) => m.status === 'live' || (m.status as string) === 'Ongoing' || (m.status as string) === 'Live'
    );
  }, [typedMatches]);

  // Countdown timer state (simulated next round countdown)
  const [countdown, setCountdown] = useState({ minutes: 14, seconds: 32 });
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { minutes: prev.minutes - 1, seconds: 59 };
        return { minutes: 15, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter active teams
  const activeTeams = useMemo(() => {
    return typedTeams.filter(
      (t) => (t.status === undefined || t.status === 'Approved') && !t.disqualified
    );
  }, [typedTeams]);

  // Compute standings table
  const standings = useMemo((): TeamScoreRow[] => {
    return (activeTeams ?? [])
      .map((team, idx) => {
        const teamMatches = typedMatches.filter((m) =>
          (m.scores ?? []).some((s) => s.teamId === team.id)
        );
        const wwcds = teamMatches.filter((m) => {
          const s = (m.scores ?? []).find((sc) => sc.teamId === team.id);
          return s && s.placement === 1;
        }).length;

        const killPoints = teamMatches.reduce((acc, m) => {
          const s = (m.scores ?? []).find((sc) => sc.teamId === team.id);
          return acc + (s?.kills || 0);
        }, 0);

        const placementPoints = teamMatches.reduce((acc, m) => {
          const s = (m.scores ?? []).find((sc) => sc.teamId === team.id);
          return acc + (s?.placementPoints || 0);
        }, 0);

        const totalPoints = killPoints + placementPoints;

        // Simulated rank delta (-2 to +3 for broadcast realism)
        const rankDelta = ((idx * 7) % 5) - 2;

        return {
          team,
          matchesPlayed: teamMatches.length,
          wwcds,
          killPoints,
          placementPoints,
          totalPoints,
          rankDelta,
        };
      })
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.placementPoints !== a.placementPoints) return b.placementPoints - a.placementPoints;
        if (b.killPoints !== a.killPoints) return b.killPoints - a.killPoints;
        return b.wwcds - a.wwcds;
      });
  }, [activeTeams, typedMatches]);

  const top3: PodiumTeam[] = useMemo(() => {
    return (standings ?? []).slice(0, 3).map((row) => ({
      id: row.team.id,
      name: row.team.teamName,
      logoUrl: row.team.logoUrl,
      points: row.totalPoints,
      kills: row.killPoints,
      wwcds: row.wwcds,
    }));
  }, [standings]);

  // Aggregated player MVP list
  const playersList = useMemo((): PlayerMVP[] => {
    const list: PlayerMVP[] = [];
    (activeTeams ?? []).forEach((t) => {
      if (t.members) {
        (t.members ?? []).forEach((m) => {
          const kills = m.kills || 0;
          const damage = m.damage || kills * 115;
          const survivalSeconds = m.survivalSeconds || 900;
          const mvpScore = Math.round(kills * 15 + damage * 0.05 + (survivalSeconds / 60) * 2);

          const mins = Math.floor(survivalSeconds / 60);
          const secs = survivalSeconds % 60;
          const avgSurvivalFormatted = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

          list.push({
            id: m.id,
            gameUid: m.gameUid || '',
            ign: m.ign || m.displayName || 'Player',
            displayName: m.displayName || m.ign || 'Player',
            teamId: t.id,
            teamName: t.teamName,
            teamTag: t.teamTag,
            teamLogo: t.logoUrl,
            role: m.role || 'Assaulter',
            isCaptain: m.isCaptain || false,
            matchesPlayed: t.matchesPlayed || 1,
            kills,
            survivalSeconds,
            avgSurvivalFormatted,
            damage,
            mvpScore,
          });
        });
      }
    });

    return [...list].sort((a, b) => {
      if (mvpSortBy === 'kills') return b.kills - a.kills;
      if (mvpSortBy === 'survival') return b.survivalSeconds - a.survivalSeconds;
      return b.mvpScore - a.mvpScore;
    });
  }, [activeTeams, mvpSortBy]);

  const filteredPlayers = useMemo(() => {
    if (!playerSearchQuery.trim()) return playersList ?? [];
    const q = playerSearchQuery.toLowerCase();
    return (playersList ?? []).filter(
      (p) =>
        p.ign.toLowerCase().includes(q) ||
        p.teamName.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q)
    );
  }, [playersList, playerSearchQuery]);

  const activeSquads = (activeTeams ?? []).length;
  const totalKills = (standings ?? []).reduce((acc, row) => acc + (row.killPoints || 0), 0);
  const matchesDone = typedMatches.filter((m) => m.status === 'done' || (m.status as string) === 'Completed').length;
  const visibleStandings = showAll ? (standings ?? []) : (standings ?? []).slice(0, 20);

  const handleExportCsv = () => {
    if (activeViewTab === 'standings') {
      const csvData = (standings ?? []).map((s, idx) => ({
        Rank: idx + 1,
        Squad: s.team.teamName,
        Tag: s.team.teamTag || '',
        Matches: s.matchesPlayed,
        [win.singular]: s.wwcds,
        'Kill Points': s.killPoints,
        'Placement Points': s.placementPoints,
        'Total Points': s.totalPoints,
      }));
      exportToCSV(csvData, `${game.toLowerCase()}-standings`);
    } else {
      const csvData = (filteredPlayers ?? []).map((p, idx) => ({
        Rank: idx + 1,
        IGN: p.ign,
        Squad: p.teamName,
        Role: p.role,
        Kills: p.kills,
        Damage: p.damage,
        Survival: p.avgSurvivalFormatted,
        'MVP Rating': p.mvpScore,
      }));
      exportToCSV(csvData, `${game.toLowerCase()}-mvp-players`);
    }
  };

  const handleExportExcel = () => {
    const data = (standings ?? []).map((s, idx) => ({
      Rank: idx + 1,
      Squad: s.team.teamName,
      Matches: s.matchesPlayed,
      WWCDs: s.wwcds,
      Kills: s.killPoints,
      Placement: s.placementPoints,
      Total: s.totalPoints,
    }));
    exportToExcel(data, `${game.toLowerCase()}-leaderboard`);
  };

  const viewTabs: TabItem[] = [
    { id: 'standings', label: 'Squad Standings', badge: (standings ?? []).length },
    { id: 'mvp', label: 'Player MVP Spotlight', badge: (playersList ?? []).length },
  ];

  return (
    <div className="relative w-full flex flex-col space-y-6 pb-12">
      {/* ━━━ 4A. BROADCAST NOIR FLAGSHIP HERO ━━━ */}
      <section className="relative overflow-hidden rounded-[20px] border border-border bg-surface/75 backdrop-blur-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
        {/* Pinned Corner Caption */}
        <CornerCaption position="top-right">
          SEASON 04 // OFFICIAL CIRCUIT
        </CornerCaption>

        {/* Thin Top Frame Line Accent */}
        <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-8 flex flex-col justify-center space-y-4">
            {/* TagChips Row & LiveBadge */}
            <div className="flex flex-wrap items-center gap-2">
              <TagChip variant="accent">GRAND FINALS</TagChip>
              <TagChip variant="default">{game.toUpperCase()} SQUAD</TagChip>
              <TagChip variant="muted">
                {matchesDone} / {activeTournament?.numMatches || 6} MATCHES
              </TagChip>
              {isMatchLive && <LiveBadge label="MATCH LIVE" />}
            </div>

            {/* Tournament Title in 64-96px Monospace */}
            <h1 className="font-mono text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-foreground leading-[1.05]">
              {activeTournament?.name || `${game} PRO CHAMPIONSHIP`}
            </h1>

            <p className="font-sans text-sm sm:text-base text-muted max-w-2xl leading-relaxed">
              Official global circuit tournament feed. Live scoreboard telemetry, verified match kills,
              and real-time squad placements.
            </p>

            {/* Next Match Monospace Tabular Countdown */}
            <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6 font-mono">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/70 bg-surface-2/60">
                <Timer className="w-4 h-4 text-accent" />
                <span className="text-[11px] uppercase tracking-wider text-muted">Next Match:</span>
                <span className="text-sm font-bold text-foreground tabular-nums">
                  00:{countdown.minutes < 10 ? `0${countdown.minutes}` : countdown.minutes}:
                  {countdown.seconds < 10 ? `0${countdown.seconds}` : countdown.seconds}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_#22c55e]" />
                <span className="uppercase tracking-wider">Scoring Engine Online</span>
              </div>
            </div>
          </div>

          {/* Right: 3D Orbit Core Icon (160px) */}
          <div className="lg:col-span-4 flex items-center justify-center relative">
            <OrbitCoreIcon size={160} />
          </div>
        </div>
      </section>

      {/* ━━━ COMPACT TELEMETRY STAT CARDS ━━━ */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          variant="hero"
          label="ACTIVE SQUADS"
          value={activeSquads}
          delta={{ value: '+2 new', type: 'up' }}
          tag="VERIFIED"
          loading={teamsLoading}
        />
        <StatCard
          label="TRACKED PLAYERS"
          value={(playersList ?? []).length}
          delta={{ value: 'Full Roster', type: 'neutral' }}
          loading={teamsLoading}
        />
        <StatCard
          label="TOTAL KILLS"
          value={totalKills}
          delta={{ value: '▲ 14.8/m', type: 'up' }}
          loading={teamsLoading || matchesLoading}
        />
        <StatCard
          label="COMPLETED MATCHES"
          value={`${matchesDone} / ${activeTournament?.numMatches || 6}`}
          delta={{ value: 'Phase 2', type: 'neutral' }}
          loading={matchesLoading}
        />
      </section>

      {/* ━━━ VIEW CONTROLS & EXPORTS ━━━ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <MorphTabs
          tabs={viewTabs}
          value={activeViewTab}
          onChange={setActiveViewTab}
          variant="segmented"
          density="default"
          aria-label="Leaderboard View Switcher"
        />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportCsv}
            className="font-mono text-xs uppercase"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportExcel}
            className="font-mono text-xs uppercase text-emerald-400"
            title="Download Excel spreadsheet"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            Excel
          </Button>
        </div>
      </div>

      {/* ━━━ SQUAD STANDINGS TAB ━━━ */}
      {activeViewTab === 'standings' && (
        <div className="space-y-6">
          {/* Metallic 3D Podium */}
          {(activeTeams ?? []).length >= 1 ? <Podium teams={top3} /> : <EmptyPodium />}

          {/* Live Scoreboard Table */}
          <div className="overflow-hidden rounded-[18px] border border-border bg-surface/75 backdrop-blur-xl shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                {/* Sticky Scoreboard Header */}
                <thead className="sticky top-0 z-20 border-b border-border bg-surface-2/95 backdrop-blur-xl font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                  <tr>
                    <th className="py-3 px-4 text-center w-16">Rank</th>
                    <th className="py-3 px-4">Squad Name</th>
                    <th className="py-3 px-4 text-center">Matches</th>
                    <th className="py-3 px-4 text-center text-warn">{win.singular}</th>
                    <th className="py-3 px-4 text-center">Kill Pts</th>
                    <th className="py-3 px-4 text-center">Placement</th>
                    <th className="py-3 px-5 text-right text-accent font-bold">Total Pts</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/40 font-mono text-sm">
                  {teamsLoading && (visibleStandings ?? []).length === 0 ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={`loading-${i}`} className="animate-pulse">
                        <td className="py-4 px-4 text-center text-muted">--</td>
                        <td className="py-4 px-4">
                          <div className="h-4 w-32 bg-surface-2 rounded" />
                        </td>
                        <td className="py-4 px-4 text-center text-muted">--</td>
                        <td className="py-4 px-4 text-center text-muted">--</td>
                        <td className="py-4 px-4 text-center text-muted">--</td>
                        <td className="py-4 px-4 text-center text-muted">--</td>
                        <td className="py-4 px-5 text-right text-muted">--</td>
                      </tr>
                    ))
                  ) : (visibleStandings ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted font-mono text-sm">
                        No registered squads found. Standings will appear once tournament teams are active.
                      </td>
                    </tr>
                  ) : (
                    (visibleStandings ?? []).map((row, idx) => {
                    const rank = idx + 1;
                    const isTop1 = rank === 1;
                    const isTop2 = rank === 2;
                    const isTop3 = rank === 3;
                    const isExpanded = expandedTeamId === row.team.id;

                    return (
                      <React.Fragment key={row.team.id}>
                        <tr
                          onClick={() => setExpandedTeamId(isExpanded ? null : row.team.id)}
                          className={cn(
                            'group cursor-pointer transition-colors duration-150 select-none',
                            // Edge-lit rails (Gold/Silver/Bronze at 8% tint, no garish gradients)
                            isTop1 && 'border-l-4 border-l-warn bg-[#FFB020]/[0.08] hover:bg-[#FFB020]/[0.12]',
                            isTop2 && 'border-l-4 border-l-slate-300 bg-[#E2E8F0]/[0.08] hover:bg-[#E2E8F0]/[0.12]',
                            isTop3 && 'border-l-4 border-l-amber-600 bg-[#CD7F32]/[0.08] hover:bg-[#CD7F32]/[0.12]',
                            rank > 3 && 'border-l-4 border-l-transparent bg-surface/40 hover:bg-surface-2/60'
                          )}
                        >
                          {/* Rank in 40px mono display style */}
                          <td className="py-3 px-4 text-center">
                            <span className="font-mono text-xl sm:text-2xl font-bold tabular-nums text-foreground">
                              {rank < 10 ? `0${rank}` : rank}
                            </span>
                          </td>

                          {/* Team logo, name, WWCD pip */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {row.team.logoUrl ? (
                                <img
                                  src={row.team.logoUrl}
                                  alt={row.team.teamName}
                                  className="w-8 h-8 rounded-lg object-cover border border-border shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center font-bold text-xs text-muted shrink-0">
                                  {row.team.teamName.slice(0, 2).toUpperCase()}
                                </div>
                              )}

                              <div className="truncate max-w-[160px] sm:max-w-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-foreground truncate">
                                    {row.team.teamName}
                                  </span>
                                  {row.wwcds > 0 && (
                                    <span
                                      className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-[4px] bg-warn/15 border border-warn/30 text-warn text-[10px] font-bold"
                                      title={`${row.wwcds} WWCD Victories`}
                                    >
                                      🏆 {row.wwcds}
                                    </span>
                                  )}
                                </div>
                                {row.team.teamTag && (
                                  <span className="text-xs text-muted block">
                                    [{row.team.teamTag}]
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Matches */}
                          <td className="py-3 px-4 text-center text-muted tabular-nums">
                            {row.matchesPlayed}
                          </td>

                          {/* WWCDs */}
                          <td className="py-3 px-4 text-center font-bold text-warn tabular-nums">
                            {row.wwcds}
                          </td>

                          {/* Kill Points */}
                          <td className="py-3 px-4 text-center text-foreground/90 tabular-nums">
                            {row.killPoints}
                          </td>

                          {/* Placement Points */}
                          <td className="py-3 px-4 text-center text-muted tabular-nums">
                            {row.placementPoints}
                          </td>

                          {/* Total Points (Bold, Tabular) */}
                          <td className="py-3 px-5 text-right font-black text-foreground text-base sm:text-lg tabular-nums">
                            {row.totalPoints}
                          </td>
                        </tr>

                        {/* Hover / Click mini-breakdown drawer */}
                        {isExpanded && (
                          <tr className="bg-surface-2/70 border-b border-border">
                            <td colSpan={7} className="px-6 py-3 font-mono text-xs">
                              <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-6 text-muted">
                                  <span className="font-bold text-accent uppercase tracking-wider">
                                    TELEMETRY METRICS:
                                  </span>
                                  <span>
                                    Avg Kills/Match:{' '}
                                    <strong className="text-foreground">
                                      {(row.killPoints / Math.max(1, row.matchesPlayed)).toFixed(1)}
                                    </strong>
                                  </span>
                                  <span>
                                    Placement Rate:{' '}
                                    <strong className="text-foreground">
                                      {Math.round(
                                        (row.placementPoints / Math.max(1, row.totalPoints)) * 100
                                      )}
                                      %
                                    </strong>
                                  </span>
                                  <span>
                                    Win Efficiency:{' '}
                                    <strong className="text-foreground">
                                      {Math.round(
                                        (row.wwcds / Math.max(1, row.matchesPlayed)) * 100
                                      )}
                                      %
                                    </strong>
                                  </span>
                                </div>
                                <span className="text-[11px] text-muted/60 uppercase">
                                  CLICK TO COLLAPSE ▲
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
              </table>
            </div>

            {/* Show all / Show top 20 Toggle */}
            {(standings ?? []).length > 20 && (
              <div className="p-3 text-center border-t border-border bg-surface-2/30">
                <button
                  type="button"
                  onClick={() => setShowAll((prev) => !prev)}
                  className="font-mono text-xs font-semibold uppercase tracking-wider text-accent hover:underline inline-flex items-center gap-1"
                >
                  <span>{showAll ? 'Show Top 20' : `Show All ${(standings ?? []).length} Squads`}</span>
                  {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ━━━ PLAYER MVP SPOTLIGHT TAB ━━━ */}
      {activeViewTab === 'mvp' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-border bg-surface/75">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search player or squad..."
                value={playerSearchQuery}
                onChange={(e) => setPlayerSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-surface-2 font-mono text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-muted uppercase text-[10px] mr-1">Sort:</span>
              {(['mvpScore', 'kills', 'survival'] as const).map((criteria) => (
                <button
                  key={criteria}
                  type="button"
                  onClick={() => setMvpSortBy(criteria)}
                  className={cn(
                    'px-2.5 py-1 rounded-md border text-[11px] uppercase tracking-wider transition-colors',
                    mvpSortBy === criteria
                      ? 'border-accent bg-accent/15 text-accent font-bold'
                      : 'border-border bg-surface-2/60 text-muted hover:text-foreground'
                  )}
                >
                  {criteria === 'mvpScore' ? 'MVP Rating' : criteria === 'kills' ? 'Kills' : 'Survival'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-border bg-surface/75 backdrop-blur-xl">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20 border-b border-border bg-surface-2/95 backdrop-blur-xl font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                <tr>
                  <th className="py-3 px-4 text-center w-16">Rank</th>
                  <th className="py-3 px-4">Player IGN</th>
                  <th className="py-3 px-4">Squad</th>
                  <th className="py-3 px-4 text-center">Role</th>
                  <th className="py-3 px-4 text-center">Kills</th>
                  <th className="py-3 px-4 text-center">Survival</th>
                  <th className="py-3 px-5 text-right text-accent font-bold">MVP Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono text-sm">
                {teamsLoading && (filteredPlayers ?? []).length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`mvp-loading-${i}`} className="animate-pulse">
                      <td className="py-4 px-4 text-center text-muted">--</td>
                      <td className="py-4 px-4">
                        <div className="h-4 w-28 bg-surface-2 rounded" />
                      </td>
                      <td className="py-4 px-4 text-muted">--</td>
                      <td className="py-4 px-4 text-center text-muted">--</td>
                      <td className="py-4 px-4 text-center text-muted">--</td>
                      <td className="py-4 px-4 text-center text-muted">--</td>
                      <td className="py-4 px-5 text-right text-muted">--</td>
                    </tr>
                  ))
                ) : (filteredPlayers ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted font-mono text-sm">
                      No player telemetry recorded yet.
                    </td>
                  </tr>
                ) : (
                  (filteredPlayers ?? []).map((player, idx) => (
                    <tr key={player.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-foreground tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground">
                        {player.ign}
                      </td>
                      <td className="py-3 px-4 text-muted text-xs">
                        {player.teamName}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <TagChip variant="muted">{player.role}</TagChip>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-foreground tabular-nums">
                        {player.kills}
                      </td>
                      <td className="py-3 px-4 text-center text-muted tabular-nums text-xs">
                        {player.avgSurvivalFormatted}
                      </td>
                      <td className="py-3 px-5 text-right font-black text-accent tabular-nums">
                        {player.mvpScore}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
