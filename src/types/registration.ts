export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type PaymentStatus = 'pending' | 'verified' | 'rejected';

// Alias for backwards compatibility
export type RegistrationStatus = ApprovalStatus;

export interface Registration {
  id: string;
  tournamentId: string;
  teamName: string;
  leaderEmail: string;
  players: string[]; // exactly 4 players
  ownerUid: string;
  status: ApprovalStatus; // keeps legacy status synced
  approvalStatus: ApprovalStatus;
  paymentStatus: PaymentStatus;
  otr: string;
  paymentScreenshotUrl: string;
  teamLogoUrl?: string;
  rulesVersion: string;
  acceptedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  paymentReviewedBy?: string;
  paymentReviewedAt?: string;
  paymentReviewNote?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OtrClaim {
  otr: string;
  tournamentId: string;
  registrationId: string;
  ownerUid: string;
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
