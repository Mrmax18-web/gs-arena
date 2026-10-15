import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Swords, Lock, RefreshCw, Key, CheckCircle2 } from 'lucide-react';
import type { LayoutContextType } from '../components/layout/Layout';
import { useTournament } from '../context/TournamentContext';
import { useTeams, useMatches } from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';
import { CSBracket } from '../components/cs/CSBracket';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/EmptyState';
import { TagChip } from '../components/ui/TagChip';
import { createSeed, generateBracket } from '../lib/cs/randomMatchmaking';
import { updateTournament, createMatch } from '../lib/firestore';
import type { Game } from '../types';

export interface CSBracketPageProps {
  propGame?: Game;
}

/**
 * Broadcast-grade Clash Squad championship bracket tree.
 * Renders single-elimination tournament nodes with reproducible seeding and zoom controls.
 */
export function CSBracketPage({ propGame }: CSBracketPageProps = {}) {
  const context = useOutletContext<LayoutContextType | null>();
  const { activeTournament } = useTournament();
  const game = propGame || context?.game || activeTournament?.game || 'Free Fire';
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const { data: teams } = useTeams(activeTournament?.id);
  const { data: matches } = useMatches(activeTournament?.id);

  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isLocked = Boolean(activeTournament?.cs_bracket_locked);
  const seed = activeTournament?.cs_matchmaking_seed;

  const handleGenerateBracket = async () => {
    if (!activeTournament || teams.length === 0) return;
    setIsGenerating(true);
    setSuccessMessage(null);
    try {
      const newSeed = createSeed();
      const teamIds = teams.map((t) => t.id);
      const generated = generateBracket(teamIds, newSeed);

      const startTime = new Date();
      let matchOffset = 0;
      for (const pair of generated.round1) {
        const teamAId = pair[0];
        const teamBId = pair[1];
        await createMatch(activeTournament.id, {
          roundNumber: 1,
          teamAId: teamAId === 'BYE' ? '' : teamAId,
          teamBId: teamBId === 'BYE' ? '' : teamBId,
          mapName: 'Bermuda Remastered',
          status: 'scheduled',
          teamARoundWins: 0,
          teamBRoundWins: 0,
          scheduledAt: new Date(startTime.getTime() + matchOffset * 30 * 60000).toISOString(),
          notes: 'Quarter-Final Knockout',
        });
        matchOffset++;
      }

      await updateTournament(activeTournament.id, {
        cs_matchmaking_seed: newSeed,
        cs_bracket_locked: true,
      });

      setSuccessMessage('Clash Squad tournament bracket seeded and locked successfully.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      console.warn('Error generating bracket:', err);
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
      <div className="relative overflow-hidden rounded-2xl p-6 border border-border bg-surface/75 backdrop-blur-md">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <TagChip label={`${game} Clash Squad`} variant="accent" size="sm" />
              {isLocked ? (
                <TagChip label="LOCKED" variant="warn" size="sm" />
              ) : (
                <TagChip label="OPEN BRACKET" variant="cyan" size="sm" />
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight flex items-center gap-3 font-mono">
              <Swords className="w-8 h-8 text-rose-500" />
              Tournament Bracket Tree
            </h1>
            <p className="text-sm text-muted mt-1 font-sans">
              Single-elimination Clash Squad championship bracket generated with reproducible 32-character seed.
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3">
              {!isLocked ? (
                <Button
                  variant="primary"
                  onClick={handleGenerateBracket}
                  disabled={isGenerating || teams.length < 2}
                  className="text-xs"
                >
                  <RefreshCw className={isGenerating ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5'} />
                  <span>{isGenerating ? 'Generating Seed...' : 'Generate Bracket'}</span>
                </Button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs text-muted font-mono">
                  <Key className="w-3.5 h-3.5 text-warn" />
                  <span>Seed: {seed ? seed.slice(0, 8) + '...' : 'Locked'}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {teams.length < 2 && matches.length === 0 ? (
        <EmptyState
          icon={<Swords className="w-8 h-8 text-rose-500" />}
          title="Bracket Awaiting Squads"
          description="Register at least 2 teams to seed and generate a Clash Squad tournament knockout bracket."
        />
      ) : (
        <CSBracket
          matches={matches}
          teams={teams}
          isAdmin={isAdmin}
          onMatchClick={handleMatchClick}
          bracketLocked={isLocked}
        />
      )}
    </div>
  );
}
