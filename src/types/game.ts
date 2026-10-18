export type GameId = 'BGMI' | 'FF_BR' | 'FF_CS';

export type GameMode = 'Battle Royale' | 'Clash Squad';

export interface MvpWeights {
  kills: number;
  damage: number;
  assists: number;
  survivalSeconds: number;
  revives: number;
}

export interface GameConfig {
  id: GameId;
  name: string;
  mode: GameMode;
  placementPoints: number[];
  killPoints: number;
  matchWinPoints?: number;
  mvpWeights: MvpWeights;
  rules: string;
}
