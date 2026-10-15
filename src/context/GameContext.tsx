import { createContext, useContext, useState, ReactNode } from 'react';

export type Game = 'BGMI' | 'Free Fire';
export type Mode = 'BR' | 'CS';

export interface GameContextType {
  currentGame: Game;
  setCurrentGame: (game: Game) => void;
  currentMode: Mode;
  setCurrentMode: (mode: Mode) => void;
  hasSelectedGame: boolean;
  clearGame: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentGame, setCurrentGameState] = useState<Game>(() => {
    const saved = localStorage.getItem('selectedGame') || localStorage.getItem('ttp_game');
    if (saved === 'BGMI' || saved === 'Free Fire') {
      return saved as Game;
    }
    return 'BGMI';
  });

  const [currentMode, setCurrentModeState] = useState<Mode>(() => {
    const saved = localStorage.getItem('selectedMode') || localStorage.getItem('ttp_mode');
    if (saved === 'BR' || saved === 'CS') {
      return saved as Mode;
    }
    return 'BR';
  });

  const [hasSelectedGame, setHasSelectedGame] = useState<boolean>(() => {
    const saved = localStorage.getItem('selectedGame') || localStorage.getItem('ttp_game');
    return saved === 'BGMI' || saved === 'Free Fire';
  });

  function setCurrentGame(game: Game) {
    console.log('[GameContext] Switching current game arena to:', game);
    localStorage.setItem('selectedGame', game);
    localStorage.setItem('ttp_game', game);
    setCurrentGameState(game);
    setHasSelectedGame(true);
  }

  function setCurrentMode(mode: Mode) {
    console.log('[GameContext] Switching current mode to:', mode);
    localStorage.setItem('selectedMode', mode);
    localStorage.setItem('ttp_mode', mode);
    setCurrentModeState(mode);
  }

  function clearGame() {
    console.log('[GameContext] Clearing selected arena game');
    localStorage.removeItem('selectedGame');
    localStorage.removeItem('ttp_game');
    localStorage.removeItem('selectedMode');
    localStorage.removeItem('ttp_mode');
    setHasSelectedGame(false);
  }

  return (
    <GameContext.Provider
      value={{
        currentGame,
        setCurrentGame,
        currentMode,
        setCurrentMode,
        hasSelectedGame,
        clearGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used inside GameProvider');
  }
  return ctx;
}
