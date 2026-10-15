import React, { useState } from 'react';
import { Lock, ZoomIn, ZoomOut, RotateCcw, Shield, Swords, CheckCircle2, Clock } from 'lucide-react';
import type { Match, Team } from '../../types';
import { cn } from '../../lib/cn';

export interface CSBracketProps {
  matches: Match[];
  teams: Team[];
  isAdmin: boolean;
  onMatchClick?: (matchId: string) => void;
  bracketLocked?: boolean;
}

export function CSBracket({
  matches,
  teams,
  isAdmin,
  onMatchClick,
  bracketLocked = false,
}: CSBracketProps) {
  const [zoom, setZoom] = useState<number>(1);
  const teamMap = new Map<string, Team>(teams.map((t) => [t.id, t]));

  const handleZoomIn = () => setZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(1))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.6, Number((z - 0.1).toFixed(1))));
  const handleZoomReset = () => setZoom(1);

  const round1Matches = matches.filter((m) => m.roundNumber === 1 || !m.roundNumber);
  const semiMatches = matches.filter((m) => m.roundNumber === 2);
  const finalMatches = matches.filter((m) => m.roundNumber === 3 || m.roundNumber >= 3);

  const displayedRounds: Array<{ title: string; matches: Match[] }> = [];
  if (matches.length > 0) {
    if (round1Matches.length > 0) {
      displayedRounds.push({ title: 'Quarter-Finals', matches: round1Matches.slice(0, 4) });
    }
    if (semiMatches.length > 0 || round1Matches.length >= 2) {
      displayedRounds.push({
        title: 'Semi-Finals',
        matches: semiMatches.length > 0 ? semiMatches.slice(0, 2) : round1Matches.slice(0, 2),
      });
    }
    if (finalMatches.length > 0 || semiMatches.length >= 1) {
      displayedRounds.push({
        title: 'Grand Final',
        matches: finalMatches.length > 0 ? finalMatches.slice(0, 1) : (semiMatches.slice(0, 1) || round1Matches.slice(0, 1)),
      });
    }
  }

  const renderStatusBadge = (status: Match['status']) => {
    switch (status) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Live
          </span>
        );
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Done
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Clock className="w-3 h-3" />
            Scheduled
          </span>
        );
    }
  };

  const renderTeamBox = (teamId: string, wins: number, isWinner: boolean) => {
    const team = teamMap.get(teamId);
    const displayName = team ? team.teamName : teamId === 'BYE' ? 'BYE (Advance)' : teamId || 'TBD';
    const tag = team?.teamTag;

    return (
      <div
        className={cn(
          'flex items-center justify-between p-2 rounded-lg border transition-all text-xs',
          isWinner
            ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 border-orange-500/50 text-white font-bold'
            : 'bg-white/5 border-white/10 text-gray-300'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {team?.logoUrl ? (
            <img
              src={team.logoUrl}
              alt={displayName}
              className="w-5 h-5 rounded-md object-cover border border-white/20 shrink-0"
            />
          ) : (
            <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center shrink-0 text-xs text-gray-400 font-bold">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="truncate">
            <span className="truncate">{displayName}</span>
            {tag && <span className="ml-1 text-xs text-slate-400 font-mono">[{tag}]</span>}
          </div>
        </div>
        <span
          className={cn(
            'px-2 py-0.5 rounded text-xs font-mono font-bold shrink-0',
            isWinner ? 'bg-orange-500 text-black' : 'bg-black/40 text-gray-400'
          )}
        >
          {wins}
        </span>
      </div>
    );
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl glass-card border border-white/10 p-4 sm:p-6">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <Swords className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Clash Squad Bracket
              {bracketLocked && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                  <Lock className="w-3 h-3" />
                  Locked
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-400">Best of 7 rounds (first to 4 wins)</p>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-semibold px-1 text-gray-300">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomReset}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
            title="Reset zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bracket Tree Container */}
      <div className="w-full overflow-x-auto overflow-y-hidden py-4 select-none">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          className="min-w-[700px] transition-transform duration-200"
        >
          {displayedRounds.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Shield className="w-10 h-10 mx-auto text-gray-500 mb-2 opacity-50" />
              <p className="text-sm font-medium">No bracket matches scheduled yet.</p>
              <p className="text-xs text-gray-500 mt-1">
                Admin can click "Generate Bracket" to seed pairings.
              </p>
            </div>
          ) : (
            <div className="grid grid-flow-col auto-cols-[240px] gap-8 items-center">
              {displayedRounds.map((round) => (
                <div key={round.title} className="flex flex-col justify-around h-full space-y-6">
                  {/* Round Header */}
                  <div className="text-center pb-2 border-b border-white/10">
                    <span className="text-xs font-extrabold text-orange-400 tracking-wider uppercase font-['Teko',sans-serif] text-base">
                      {round.title}
                    </span>
                  </div>

                  {/* Matches List */}
                  <div className="flex flex-col justify-around space-y-6 flex-1">
                    {round.matches.map((m) => {
                      const isTeamAWinner = m.winnerTeamId ? m.winnerTeamId === m.teamAId : m.teamARoundWins >= 4;
                      const isTeamBWinner = m.winnerTeamId ? m.winnerTeamId === m.teamBId : m.teamBRoundWins >= 4;

                      return (
                        <div
                          key={m.id || `${m.teamAId}-${m.teamBId}-${m.roundNumber}`}
                          onClick={() => onMatchClick?.(m.id)}
                          className={cn(
                            'group relative flex flex-col p-3 rounded-xl bg-black/60 border border-white/10 transition-all duration-200 shadow-lg',
                            onMatchClick && 'cursor-pointer hover:border-orange-500/50 hover:bg-black/80 hover:shadow-orange-500/10'
                          )}
                        >
                          {/* Match Header */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-400 font-medium truncate max-w-[130px]">
                              {m.mapName || 'Bermuda'}
                            </span>
                            {renderStatusBadge(m.status)}
                          </div>

                          {/* Teams Pairing */}
                          <div className="space-y-1.5">
                            {renderTeamBox(m.teamAId, m.teamARoundWins || 0, isTeamAWinner)}
                            {renderTeamBox(m.teamBId, m.teamBRoundWins || 0, isTeamBWinner)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
