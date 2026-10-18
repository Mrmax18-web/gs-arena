import { GameId, MvpWeights } from './game';

export type TournamentStatus = 'draft' | 'upcoming' | 'live' | 'completed';
export type MatchStatus = 'scheduled' | 'live' | 'completed';

export interface ScoringSnapshot {
  placementPoints: number[];
  killPoints: number;
  matchWinPoints?: number;
  mvpWeights: MvpWeights;
}

export interface Tournament {
  id: string;
  name: string;
  gameId: GameId;
  status: TournamentStatus;
  registrationOpen: boolean;
  rosterSize: number;
  scoringSnapshot: ScoringSnapshot;
  entryFeePaise?: number;
  upiQrUrl?: string;
  upiId?: string;
  isDemo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicTeamAnalytics {
  teamId: string;
  teamName: string;
  totalKills: number;
  matchesPlayed: number;
}

export interface PublicPlayerAnalytics {
  playerId: string;
  playerName: string;
  teamName: string;
  kills: number;
  damage: number;
  matchesPlayed: number;
}

export interface TournamentAnalyticsData {
  tournamentId: string;
  tournamentName: string;
  gameId: GameId;
  teamKills: PublicTeamAnalytics[];
  playerKills: PublicPlayerAnalytics[];
  updatedAt?: string;
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  kills: number;
  damage: number;
  assists: number;
  survivalSeconds: number;
  revives: number;
  mvpScore?: number;
}

export interface TeamMatchResult {
  teamId: string;
  teamName: string;
  placement: number;
  kills: number;
  placementPoints: number;
  killPoints: number;
  totalPoints: number;
  roundsWon?: number;
  roundsLost?: number;
  playerStats: PlayerStats[];
}

export interface Match {
  id: string;
  tournamentId: string;
  matchNumber: number;
  scheduledAt: string;
  map: string;
  status: MatchStatus;
  results: TeamMatchResult[];
  isDemo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Team {
  id: string;
  tournamentId: string;
  teamName: string;
  players: string[]; // Public safe: player display names only
  createdAt?: string;
}

export interface MatchSecret {
  id: string;
  roomId: string;
  roomPassword: string;
  credentialsSentAt?: string | null;
  updatedAt?: string;
}

export interface TournamentStandingsRow {
  rank: number;
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  placementPoints: number;
  killPoints: number;
  totalKills: number;
  totalPoints: number;
  wwcdCount: number;
  matchWins?: number;
  roundsWon?: number;
  roundsLost?: number;
  roundDifference?: number;
  bestPlacement?: number;
  isLeader?: boolean;
}

export interface AwardWinner {
  playerId: string;
  playerName: string;
  teamName: string;
  score: number;
  kills?: number;
  scope: string; // e.g., "Match 3" or "Tournament"
}
