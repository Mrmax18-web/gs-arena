import React, { useCallback } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingOrbs } from '../ui/FloatingOrbs';
import { useTournament } from '../../context/TournamentContext';
import { useGame } from '../../context/GameContext';
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

  const setGame = useCallback(
    (next: Game) => {
      setCurrentGame(next);
    },
    [setCurrentGame]
  );

  return (
    <div className="relative min-h-screen text-gray-100 flex flex-col md:flex-row overflow-x-hidden">
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
  return <LayoutContent />;
}
