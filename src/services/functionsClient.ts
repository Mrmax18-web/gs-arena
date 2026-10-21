// src/services/functionsClient.ts
// Cloud Functions have been replaced by direct Firestore client operations to avoid billing requirements.

export interface SendCredentialsResponse {
  status: 'sent' | 'not_configured' | 'partial' | 'error';
  recipientCount?: number;
  successCount?: number;
  failedCount?: number;
  message?: string;
}

export interface ReviewAdminResponse {
  success: boolean;
  message?: string;
}

export interface DeleteDataResponse {
  success: boolean;
  deletedCounts?: {
    tournaments?: number;
    matches?: number;
    registrations?: number;
    matchSecrets?: number;
    contactMessages?: number;
  };
  message?: string;
}
