import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { MorphTabs, type TabItem } from '../ui/MorphTabs';
import { TagChip } from '../ui/TagChip';
import { FeatureList, type FeatureItem } from '../ui/FeatureList';
import { Button } from '../ui/Button';
import { cn } from '../../lib/cn';
import type { Game } from '../../types';

export interface Step1GameSelectProps {
  selectedGame: Game;
  onSelectGame: (game: Game) => void;
  onNext: () => void;
}

/**
 * Step 1: Format & Tier Selection matching Reference-B pricing page architecture.
 * Features:
 * - Segmented MorphTabs toggle for BGMI / Free Fire.
 * - Three package cards: Starter, Pro (lifted hero card with gradient wash), and Elite.
 * - TagChips above each card.
 * - FeatureList with check/cross rows inside.
 */
export function Step1GameSelect({
  selectedGame,
  onSelectGame,
  onNext,
}: Step1GameSelectProps) {
  const [selectedTier, setSelectedTier] = useState<'starter' | 'pro' | 'elite'>('pro');

  const gameTabs: TabItem[] = [
    { id: 'BGMI', label: 'BGMI Circuit' },
    { id: 'Free Fire', label: 'Free Fire Circuit' },
  ];

  const starterFeatures: FeatureItem[] = [
    { label: 'Standard 4-Player Roster Entry', included: true },
    { label: 'Official Circuit Leaderboard Tracking', included: true },
    { label: 'Automated Placement Point Matrix', included: true },
    { label: '1 Dedicated Substitute Slot', included: false },
    { label: 'Advanced Combat Damage Telemetry', included: false },
    { label: 'Priority Admin Verification Queue', included: false },
  ];

  const proFeatures: FeatureItem[] = [
    { label: 'Standard 4-Player Roster Entry', included: true },
    { label: 'Official Circuit Leaderboard Tracking', included: true },
    { label: 'Automated Placement Point Matrix', included: true },
    { label: '2 Dedicated Substitute Slots', included: true },
    { label: 'Advanced Combat Damage Telemetry', included: true },
    { label: 'Priority Admin Verification Queue', included: true, note: 'FAST TRACK' },
  ];

  const eliteFeatures: FeatureItem[] = [
    { label: 'Multi-Squad Clan Entry (Up to 3 Rosters)', included: true },
    { label: 'Custom Team Tag & Clan Branding', included: true },
    { label: 'Full Match Telemetry & Fragger Analytics', included: true },
    { label: 'Dedicated Clan Discord Role Sync', included: true },
    { label: '24/7 Priority Discord Support', included: true },
    { label: 'Direct Broadcast Stage Ingestion', included: true, note: 'OFFICIAL' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5">
          <TagChip variant="accent">STEP 01 // FORMAT & TIER</TagChip>
        </div>
        <h2 className="font-mono text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
          SELECT CIRCUIT TIER
        </h2>
        <p className="font-sans text-xs sm:text-sm text-muted">
          Choose your tournament title and competition package. All tiers receive verified official circuit scoring.
        </p>

        {/* Segmented Game Toggle (BGMI / Free Fire) */}
        <div className="pt-2 flex justify-center">
          <MorphTabs
            tabs={gameTabs}
            value={selectedGame}
            onChange={(g) => onSelectGame(g as Game)}
            variant="segmented"
            density="default"
            aria-label="Tournament Game Switcher"
          />
        </div>
      </div>

      {/* ━━━ THREE CARDS (REFERENCE-B ARCHITECTURE) ━━━ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 items-end">
        {/* CARD 1 — STARTER (BASIC) */}
        <div
          onClick={() => setSelectedTier('starter')}
          className={cn(
            'p-5 rounded-[18px] border transition-all duration-220 cursor-pointer flex flex-col justify-between min-h-[380px]',
            selectedTier === 'starter'
              ? 'border-accent bg-surface shadow-[0_0_20px_var(--accent-glow)]'
              : 'border-border bg-surface/70 hover:border-border/80'
          )}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <TagChip variant="default">BASIC</TagChip>
              <span className="font-mono text-xs text-muted">TIER 01</span>
            </div>

            <div>
              <h3 className="font-mono text-lg font-bold text-foreground uppercase">
                Challenger
              </h3>
              <p className="font-sans text-xs text-muted mt-0.5">
                Standard tournament entry for rookie and community squads.
              </p>
            </div>

            <div className="py-2 border-y border-border/50 font-mono">
              <span className="text-2xl font-bold text-foreground">FREE</span>
              <span className="text-xs text-muted ml-1.5 uppercase">/ Open Entry</span>
            </div>

            <FeatureList features={starterFeatures} />
          </div>

          <div className="pt-4">
            <Button
              type="button"
              variant={selectedTier === 'starter' ? 'primary' : 'secondary'}
              className="w-full text-xs font-mono uppercase"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTier('starter');
                onNext();
              }}
            >
              Select Challenger
            </Button>
          </div>
        </div>

        {/* CARD 2 — PRO (LIFTED HERO CARD WITH VERTICAL GRADIENT WASH) */}
        <div
          onClick={() => setSelectedTier('pro')}
          className={cn(
            'p-6 rounded-[20px] border transition-all duration-220 cursor-pointer flex flex-col justify-between min-h-[420px] -translate-y-2 relative overflow-hidden',
            selectedTier === 'pro'
              ? 'border-accent bg-gradient-to-b from-accent/15 via-surface to-surface-2 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_24px_var(--accent-glow),inset_0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-accent/50'
              : 'border-accent/40 bg-gradient-to-b from-accent/5 via-surface to-surface-2 hover:border-accent'
          )}
        >
          {/* Top highlight line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-accent" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <TagChip variant="accent">PRO // RECOMMENDED</TagChip>
              <span className="font-mono text-xs text-accent font-bold">TIER 02</span>
            </div>

            <div>
              <h3 className="font-mono text-xl font-bold text-foreground uppercase">
                Pro Squad
              </h3>
              <p className="font-sans text-xs text-muted mt-0.5">
                Official competitive circuit tier with verified fast-track approvals.
              </p>
            </div>

            <div className="py-2 border-y border-border/50 font-mono">
              <span className="text-2xl sm:text-3xl font-bold text-foreground">₹150</span>
              <span className="text-xs text-muted ml-1.5 uppercase">/ Squad Slot</span>
            </div>

            <FeatureList features={proFeatures} />
          </div>

          <div className="pt-4">
            <Button
              type="button"
              variant="primary"
              className="w-full text-xs font-mono uppercase shadow-lg shadow-accent/25"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTier('pro');
                onNext();
              }}
            >
              Select Pro Squad
            </Button>
          </div>
        </div>

        {/* CARD 3 — ELITE (EXPERT) */}
        <div
          onClick={() => setSelectedTier('elite')}
          className={cn(
            'p-5 rounded-[18px] border transition-all duration-220 cursor-pointer flex flex-col justify-between min-h-[380px]',
            selectedTier === 'elite'
              ? 'border-accent bg-surface shadow-[0_0_20px_var(--accent-glow)]'
              : 'border-border bg-surface/70 hover:border-border/80'
          )}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <TagChip variant="warn">EXPERT</TagChip>
              <span className="font-mono text-xs text-muted">TIER 03</span>
            </div>

            <div>
              <h3 className="font-mono text-lg font-bold text-foreground uppercase">
                Elite Clan
              </h3>
              <p className="font-sans text-xs text-muted mt-0.5">
                Comprehensive organization entry with multi-roster telemetry.
              </p>
            </div>

            <div className="py-2 border-y border-border/50 font-mono">
              <span className="text-2xl font-bold text-foreground">₹350</span>
              <span className="text-xs text-muted ml-1.5 uppercase">/ Multi-Slot</span>
            </div>

            <FeatureList features={eliteFeatures} />
          </div>

          <div className="pt-4">
            <Button
              type="button"
              variant={selectedTier === 'elite' ? 'primary' : 'secondary'}
              className="w-full text-xs font-mono uppercase"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTier('elite');
                onNext();
              }}
            >
              Select Elite Clan
            </Button>
          </div>
        </div>
      </div>

      {/* Advance Action */}
      <div className="flex justify-center pt-2">
        <Button
          type="button"
          variant="primary"
          onClick={onNext}
          className="px-8 py-2.5 font-mono text-xs uppercase"
        >
          <span>Continue Roster Application</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
