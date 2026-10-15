import React from 'react';
import { Gamepad2, Flame, ArrowRight, ShieldCheck, Trophy, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { Game } from '../../types';

export interface Step1GameSelectProps {
  selectedGame: Game;
  onSelectGame: (game: Game) => void;
  onNext: () => void;
}

export function Step1GameSelect({
  selectedGame,
  onSelectGame,
  onNext,
}: Step1GameSelectProps) {
  const handleSelectAndAdvance = (game: Game) => {
    onSelectGame(game);
    // Smooth auto-advance
    setTimeout(() => {
      onNext();
    }, 180);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 1 of 4</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black font-['Teko',sans-serif] uppercase tracking-wide text-white">
          Select Your Esports Title
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
          Choose the official tournament circuit for your squad. Your game selection determines your format and scoring system.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
        {/* BGMI CARD */}
        <Card
          onClick={() => handleSelectAndAdvance('BGMI')}
          className={`group relative overflow-hidden p-6 cursor-pointer border-2 transition-all duration-300 flex flex-col justify-between min-h-[280px] ${
            selectedGame === 'BGMI'
              ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_30px_rgba(249,115,22,0.25)] scale-[1.02]'
              : 'border-white/10 bg-black/40 hover:border-orange-500/50 hover:bg-white/[0.04]'
          }`}
        >
          {/* Full-bleed background game image */}
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="/bgmi-icon.png"
              alt="BGMI battle royale game artwork"
              className="w-full h-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            <div className="absolute inset-0 bg-orange-500/15 mix-blend-overlay" />
          </div>

          <div className="space-y-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 text-2xl group-hover:scale-110 transition-transform shadow-lg">
              🎮
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl sm:text-3xl font-bold font-['Teko',sans-serif] text-white tracking-wide">
                  BGMI
                </h3>
                <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Battle Royale
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Classic 16-squad open map survival. Standard esports kill & placement point matrix.
              </p>
            </div>
          </div>

          <div className="pt-6 relative z-10">
            <Button
              type="button"
              variant={selectedGame === 'BGMI' ? 'primary' : 'secondary'}
              className="w-full text-xs font-bold py-2.5"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectAndAdvance('BGMI');
              }}
            >
              <span>Select BGMI Circuit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* FREE FIRE CARD */}
        <Card
          onClick={() => handleSelectAndAdvance('Free Fire')}
          className={`group relative overflow-hidden p-6 cursor-pointer border-2 transition-all duration-300 flex flex-col justify-between min-h-[280px] ${
            selectedGame === 'Free Fire'
              ? 'border-red-500 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.25)] scale-[1.02]'
              : 'border-white/10 bg-black/40 hover:border-red-500/50 hover:bg-white/[0.04]'
          }`}
        >
          {/* Full-bleed background game image */}
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="/freefire-icon.png"
              alt="Free Fire clash squad game artwork"
              className="w-full h-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            <div className="absolute inset-0 bg-red-500/15 mix-blend-overlay" />
          </div>

          <div className="space-y-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 text-2xl group-hover:scale-110 transition-transform shadow-lg">
              🔥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl sm:text-3xl font-bold font-['Teko',sans-serif] text-white tracking-wide">
                  Free Fire
                </h3>
                <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                  CS & BR Circuits
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                4v4 Clash Squad round-elimination bracket or classic 12-squad Battle Royale matches.
              </p>
            </div>
          </div>

          <div className="pt-6 relative z-10">
            <Button
              type="button"
              variant={selectedGame === 'Free Fire' ? 'danger' : 'secondary'}
              className="w-full text-xs font-bold py-2.5"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectAndAdvance('Free Fire');
              }}
            >
              <span>Select Free Fire</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>
      </div>

      <div className="flex justify-center pt-2">
        <Button
          type="button"
          variant="primary"
          onClick={onNext}
          className="w-full sm:w-auto px-8 py-2.5 text-xs font-bold"
        >
          <span>Continue with {selectedGame}</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
