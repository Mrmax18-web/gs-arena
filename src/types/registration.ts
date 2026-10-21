export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type PaymentStatus = 'pending' | 'verified' | 'rejected';

// Alias for backwards compatibility
export type RegistrationStatus = ApprovalStatus;

export interface RegisteredPlayer {
  name: string;
  uid: string; // In-Game UID (numeric string, trimmed)
}

export interface Registration {
  id: string;
  tournamentId: string;
  gameId?: string;
  teamName: string;
  leaderName: string;
  leaderEmail: string;
  leaderPhone: string;
  players: RegisteredPlayer[]; // exactly 4 players with name and in-game UID
  ownerUid?: string;
  status: ApprovalStatus; // keeps legacy status synced
  approvalStatus: ApprovalStatus;
  paymentStatus: PaymentStatus;
  otr: string;
  paymentScreenshotUrl: string;
  teamLogoUrl?: string;
  rulesVersion?: string;
  acceptedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  paymentReviewedBy?: string;
  paymentReviewedAt?: string;
  paymentReviewNote?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface OtrClaim {
  otr: string;
  tournamentId: string;
  registrationId: string;
  ownerUid?: string;
  claimedAt: string;
}

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}
