import React, { useCallback } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { CosmicBackground } from '../CosmicBackground';
import { FloatingOrbs } from '../ui/FloatingOrbs';
import { TournamentProvider, useTournament } from '../../context/TournamentContext';
import { useGame } from '../../context/GameContext';
import { useBranding } from '../../hooks/useBranding';
import type { Game, Tournament } from '../../types';

export interface LayoutContextType {
  game: Game;
  setGame: (game: Game) => void;
  tournament?: Tournament | null;
}

export type LayoutOutletContext = LayoutContextType;

export function useLayoutContext(): LayoutContextType {
  return useOutletContext<LayoutContextType>();
}

function LayoutContent() {
  const { currentGame, setCurrentGame } = useGame();
  const { activeTournament } = useTournament();
  const { branding } = useBranding();

  const waveColors =
    branding.backgroundColors && branding.backgroundColors.length > 0
      ? branding.backgroundColors
      : branding.waveColors && branding.waveColors.length > 0
      ? branding.waveColors
      : [branding.primaryColor || '#FF6B35', branding.secondaryColor || '#00D9FF'];

  const waveSettings = {
    waveSpeed: branding.backgroundWaveSpeed ?? branding.waveSpeed ?? 74,
    waveHeight: branding.backgroundWaveHeight ?? branding.waveHeight ?? 227,
    waveLength: branding.backgroundWaveLength ?? branding.waveLength ?? 2690,
  };

  const isWaveEnabled = branding.backgroundEnabled !== false && branding.waveEnabled !== false;

  const setGame = useCallback(
    (next: Game) => {
      setCurrentGame(next);
    },
    [setCurrentGame]
  );

  return (
    <div className="relative min-h-screen text-gray-100 flex flex-col md:flex-row bg-[#03040a] overflow-x-hidden">
      {/* ━━━ BACKGROUND RENDERING ━━━ */}
      {isWaveEnabled ? (
        <div
          className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-70"
          aria-hidden="true"
        >
      
        </div>
      ) : (
        <div
          className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <CosmicBackground />
          <div className="hex-grid absolute inset-0 opacity-40 pointer-events-none" />
        </div>
      )}
      <FloatingOrbs />

      {/* Sidebar */}
      <Sidebar currentGame={currentGame} />

      {/* Main Content Area with integrated Header and Footer */}
      <div className="flex-1 min-w-0 pt-14 md:pt-0 z-10 flex flex-col min-h-screen overflow-y-auto">
        <Header />
        <main
          role="main"
          aria-label="Main content"
          className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col min-h-0"
        >
          <Outlet
            context={
              {
                game: currentGame,
                setGame,
                tournament: activeTournament,
              } satisfies LayoutContextType
            }
          />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export function Layout() {
  const { currentGame } = useGame();

  return (
    <TournamentProvider game={currentGame}>
      <LayoutContent />
    </TournamentProvider>
  );
}
