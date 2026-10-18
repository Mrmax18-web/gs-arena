export type UserRole = 'public' | 'admin' | 'creator';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export type AdminRequestStatus = 'pending' | 'approved' | 'rejected';

export interface AdminRequest {
  uid: string;
  name: string;
  email: string;
  reason: string;
  contact: string;
  status: AdminRequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
}

export interface AuthState {
  user: import('firebase/auth').User | null;
  role: UserRole;
  loading: boolean;
  error: string | null;
}
