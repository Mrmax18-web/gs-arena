export type Game = 'BGMI' | 'Free Fire';
export type Mode = 'BR' | 'CS';
export type TournamentStatus = 'Open' | 'Locked' | 'In Progress' | 'Completed';

export interface Tournament {
  id: string;
  game: Game;
  name: string;
  startDate: string;
  endDate: string;
  numMatches: number;
  status: TournamentStatus;
  mode: Mode;
  registrationDeadline?: string;
  registrationOpen?: boolean;
  cs_group_count?: number;
  cs_teams_per_group?: number;
  cs_rounds_per_match?: number;
  cs_win_threshold?: number;
  cs_matchmaking_seed?: string;
  cs_bracket_locked?: boolean;
  cs_map_pool?: string[];
  bannerUrl?: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface Team {
  id: string;
  teamName: string;
  teamTag?: string;
  captainName: string;
  captainPhone: string;
  captainEmail: string;
  logoUrl?: string;
  mode: Mode;
  registeredAt: string;
  disqualified?: boolean;
  disqualifiedAt?: string;
  disqualifiedBy?: string;
  disqualificationReason?: string;
  isDemo?: boolean;
  updatedAt?: string;
}

export interface Member {
  id: string;
  gameUid: string;
  displayName?: string;
  ign?: string;
  email?: string;
  isCaptain: boolean;
  isSubstitute: boolean;
  joinedAt: string;
  isDemo?: boolean;
}

export interface Match {
  id: string;
  groupLabel?: string;
  roundNumber: number;
  teamAId: string;
  teamBId: string;
  mapName: string;
  scheduledAt: string;
  status: 'scheduled' | 'live' | 'done';
  teamARoundWins: number;
  teamBRoundWins: number;
  winnerTeamId?: string;
  notes?: string;
  teamAPlacement?: number;
  teamBPlacement?: number;
  teamAKills?: number;
  teamBKills?: number;
  countdownStartedAt?: string;
  matchStartedAt?: string;
  endedAt?: string;
  isDemo?: boolean;
}

export interface Registration {
  id: string;
  game: Game;
  mode: Mode;
  tournamentId: string;
  teamName: string;
  teamTag?: string;
  captainName: string;
  captainPhone: string;
  captainEmail: string;
  players: Array<{ uid: string; name: string; ign?: string; email?: string }>;
  logoUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  paymentStatus: 'unpaid' | 'pending_verification' | 'verified' | 'failed';
  upiTransactionId?: string;
  paymentScreenshotUrl?: string;
  registrationFeePaid?: number;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  notes?: string;
  updatedAt?: string;
  isDemo?: boolean;
}

export interface Payment {
  id: string;
  registrationId: string;
  teamName: string;
  captainEmail: string;
  amount: number;
  utr: string;
  screenshotUrl: string;
  paidAt: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  isDemo?: boolean;
}

export interface AdminRequest {
  id: string;
  email: string;
  name: string;
  reason?: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface Branding {
  headerLogo: string;
  headerLogoAlt: string;
  favicon: string;
  bgmiIcon: string;
  freefireIcon: string;
  landingBgmiBg: string;
  landingFFBg: string;
  teamPlaceholder: string;
  playerPlaceholder: string;
  brandName: string;
  brandSubtitle: string;
  brandTagline: string;
  primaryColor: string;
  secondaryColor: string;

  // Landing page logos
  landingBgmiLogo: string;
  landingFFLogo: string;

  // 3D gun model assignments
  bgmiPrimaryGun: string;
  bgmiPrimaryGunModel: string;
  bgmiPrimaryGunModelUrl?: string;
  bgmiPrimaryGunScale?: number;
  bgmiPrimaryGunRotation?: number;

  bgmiSecondaryGun: string;
  bgmiSecondaryGunModel: string;
  bgmiSecondaryGunModelUrl?: string;
  bgmiSecondaryGunScale?: number;
  bgmiSecondaryGunRotation?: number;

  ffPrimaryGun: string;
  ffPrimaryGunModel: string;
  ffPrimaryGunModelUrl?: string;
  ffPrimaryGunScale?: number;
  ffPrimaryGunRotation?: number;

  ffSecondaryGun: string;
  ffSecondaryGunModel: string;
  ffSecondaryGunModelUrl?: string;
  ffSecondaryGunScale?: number;
  ffSecondaryGunRotation?: number;

  // Custom gun model uploads (filename -> base64 or URL)
  customGunModels?: Record<string, string>;

  // WebGL Wave Field background settings
  waveSpeed?: number;
  waveHeight?: number;
  waveLength?: number;
  waveColors?: string[];
  waveBackground?: string;
  waveEnabled?: boolean;

  // Additional Wave Field configuration aliases used in CreatorPanel / useBranding
  logoUrl?: string;
  backgroundEnabled?: boolean;
  backgroundPreset?: string;
  backgroundColors?: string[];
  backgroundDensity?: number;
  backgroundDotSize?: number;
  backgroundWaveSpeed?: number;
  backgroundWaveHeight?: number;
  backgroundWaveLength?: number;
  backgroundCameraHeight?: number;
  backgroundScatter?: number;
  backgroundTiltStart?: number;
  backgroundRollStart?: number;

  updatedAt: string;
  updatedBy: string;
}
