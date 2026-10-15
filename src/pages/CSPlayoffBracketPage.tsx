import React, { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Trophy, Zap, CheckCircle2 } from 'lucide-react';
import type { LayoutContextType } from '../components/layout/Layout';
import { useTournament } from '../context/TournamentContext';
import { useTeams, useMatches } from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';
import { CSBracket } from '../components/cs/CSBracket';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/EmptyState';
import { createMatch } from '../lib/firestore';
import type { Game } from '../types';

export interface CSPlayoffBracketPageProps {
  propGame?: Game;
}

export function CSPlayoffBracketPage({ propGame }: CSPlayoffBracketPageProps = {}) {
  const context = useOutletContext<LayoutContextType | null>();
  const { activeTournament } = useTournament();
  const game = propGame || context?.game || activeTournament?.game || 'Free Fire';
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const { data: teams } = useTeams(activeTournament?.id);
  const { data: matches } = useMatches(activeTournament?.id);

  const [isGenerating, setIsGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const playoffMatches = useMemo(() => {
    return matches.filter((m) => m.notes?.toLowerCase().includes('playoff') || m.roundNumber >= 2);
  }, [matches]);

  const handleGeneratePlayoffs = async () => {
    if (!activeTournament || teams.length < 4) return;
    setIsGenerating(true);
    setSuccessMsg(null);
    try {
      const playoffTeams = teams.slice(0, 4);
      const startTime = new Date();

      await createMatch(activeTournament.id, {
        roundNumber: 2,
        teamAId: playoffTeams[0]?.id || '',
        teamBId: playoffTeams[3]?.id || '',
        mapName: 'Nexterra',
        status: 'scheduled',
        teamARoundWins: 0,
        teamBRoundWins: 0,
        scheduledAt: new Date(startTime.getTime() + 60 * 60000).toISOString(),
        notes: 'Playoffs Semi-Final 1',
      });

      await createMatch(activeTournament.id, {
        roundNumber: 2,
        teamAId: playoffTeams[1]?.id || '',
        teamBId: playoffTeams[2]?.id || '',
        mapName: 'Nexterra',
        status: 'scheduled',
        teamARoundWins: 0,
        teamBRoundWins: 0,
        scheduledAt: new Date(startTime.getTime() + 90 * 60000).toISOString(),
        notes: 'Playoffs Semi-Final 2',
      });

      await createMatch(activeTournament.id, {
        roundNumber: 3,
        teamAId: '',
        teamBId: '',
        mapName: 'Bermuda Remastered',
        status: 'scheduled',
        teamARoundWins: 0,
        teamBRoundWins: 0,
        scheduledAt: new Date(startTime.getTime() + 150 * 60000).toISOString(),
        notes: 'Playoffs Grand Final Championship',
      });

      setSuccessMsg('Playoff knockout tree successfully generated.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: unknown) {
      console.warn('Error generating playoffs:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMatchClick = (matchId: string) => {
    if (isAdmin) {
      navigate(`/cs-results?matchId=${matchId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl p-5 border border-white/10 bg-black/40">
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/freefire-icon.png"
            alt=""
            role="presentation"
            className="w-full h-full object-cover opacity-20"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-red-950/80 via-black/90 to-[#03040a]" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-extrabold tracking-widest px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                {game} Clash Squad
              </span>
              <span className="text-xs text-amber-400 font-bold">Championship Finals</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3 font-['Teko',sans-serif] text-4xl">
              <Trophy className="w-8 h-8 text-amber-400" />
              CS Playoff Knockout Bracket
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Post-group stage single-elimination finals. Top seeded squads battle for the title.
            </p>
          </div>

          {isAdmin && (
            <Button
              variant="primary"
              onClick={handleGeneratePlayoffs}
              disabled={isGenerating || teams.length < 4}
              className="text-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Seeding Finals...' : 'Seed Playoff Bracket'}</span>
            </Button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {teams.length < 4 && playoffMatches.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-8 h-8 text-amber-400" />}
          title="Playoffs Awaiting Qualified Squads"
          description="At least 4 registered teams are required to seed the Championship Playoff finals tree."
        />
      ) : (
        <CSBracket
          matches={playoffMatches.length > 0 ? playoffMatches : matches}
          teams={teams}
          isAdmin={isAdmin}
          onMatchClick={handleMatchClick}
          bracketLocked={true}
        />
      )}
    </div>
  );
}
