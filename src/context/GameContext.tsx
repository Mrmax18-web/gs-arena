import React, { createContext, useContext, useState, useEffect } from 'react';
import { GameConfig, GameId } from '../types/game';
import { CANONICAL_GAMES, GAME_STORAGE_KEY } from '../lib/constants';

interface GameContextType {
  gameId: GameId;
  game: GameConfig;
  setGameId: (id: GameId) => void;
}

const VALID_GAME_IDS: readonly GameId[] = ['BGMI', 'FF_BR', 'FF_CS'] as const;

export function isValidGameId(val: unknown): val is GameId {
  return typeof val === 'string' && VALID_GAME_IDS.includes(val as GameId);
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameId, setGameIdState] = useState<GameId>(() => {
    if (typeof window === 'undefined') return 'BGMI';
    try {
      const stored = localStorage.getItem(GAME_STORAGE_KEY);
      if (isValidGameId(stored)) {
        return stored;
      }
    } catch {
      // Storage unavailable
    }
    return 'BGMI';
  });

  useEffect(() => {
    try {
      localStorage.setItem(GAME_STORAGE_KEY, gameId);
    } catch {
      // Ignore
    }
  }, [gameId]);

  const setGameId = (id: GameId) => {
    if (isValidGameId(id)) {
      setGameIdState(id);
    }
  };

  const game = CANONICAL_GAMES[gameId] ?? CANONICAL_GAMES.BGMI;

  return (
    <GameContext.Provider value={{ gameId, game, setGameId }}>
      {children}
    </GameContext.Provider>
  );
};

export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
