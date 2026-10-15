export const GAMES = {
  BGMI: {
    name: 'BGMI',
    icon: '🎮',
    color: '#FF6B35',
    accent: '#FFD166',
  },
  'Free Fire': {
    name: 'Free Fire',
    icon: '🔥',
    color: '#FF2D2D',
    accent: '#FF7A00',
  },
} as const;

export const GAME_META: Record<string, { name: string; icon: string; color: string; accent: string }> = {
  BGMI: {
    name: 'BGMI',
    icon: '🎮',
    color: '#FF6B35',
    accent: '#FFD166',
  },
  'Free Fire': {
    name: 'Free Fire',
    icon: '🔥',
    color: '#FF2D2D',
    accent: '#FF7A00',
  },
  bgmi: {
    name: 'BGMI',
    icon: '🎮',
    color: '#FF6B35',
    accent: '#FFD166',
  },
  freefire: {
    name: 'Free Fire',
    icon: '🔥',
    color: '#FF2D2D',
    accent: '#FF7A00',
  },
};

export function readStoredGame(): 'BGMI' | 'Free Fire' {
  if (typeof window === 'undefined') return 'BGMI';
  const saved = localStorage.getItem('selectedGame') || localStorage.getItem('ttp_game');
  if (saved === 'BGMI' || saved === 'Free Fire') return saved;
  return 'BGMI';
}

export function storeGame(game: 'BGMI' | 'Free Fire'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('selectedGame', game);
  localStorage.setItem('ttp_game', game);
}

export type GameKey = keyof typeof GAMES;

export function getGameConfig(game: 'BGMI' | 'Free Fire') {
  return GAMES[game];
}

/**
 * Returns game-specific victory terminology and icons.
 * BGMI uses "WWCD" / "chicken dinners" 🍗
 * Free Fire uses "BOOYAH" / "BOOYAHs" 🔥
 */
export function getWinTerm(game: 'BGMI' | 'Free Fire' | string): {
  singular: string;
  plural: string;
  emoji: string;
} {
  const isBgmi = typeof game === 'string' && (game.toLowerCase() === 'bgmi' || game === 'BGMI');
  if (isBgmi) {
    return {
      singular: 'WWCD',
      plural: 'chicken dinners',
      emoji: '🍗',
    };
  }
  return {
    singular: 'BOOYAH',
    plural: 'BOOYAHs',
    emoji: '🔥',
  };
}
