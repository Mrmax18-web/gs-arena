import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

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

export async function callClaimCreator(code: string): Promise<{ success: boolean; message?: string }> {
  if (!functions) throw new Error('Firebase Functions is not configured');
  const fn = httpsCallable<{ code: string }, { success: boolean; message?: string }>(
    functions,
    'claimCreator'
  );
  const result = await fn({ code });
  return result.data;
}

export async function callReviewAdminRequest(
  uid: string,
  decision: 'approve' | 'reject',
  reviewNote?: string
): Promise<ReviewAdminResponse> {
  if (!functions) throw new Error('Firebase Functions is not configured');
  const fn = httpsCallable<
    { uid: string; decision: 'approve' | 'reject'; reviewNote?: string },
    ReviewAdminResponse
  >(functions, 'reviewAdminRequest');
  const result = await fn({ uid, decision, reviewNote });
  return result.data;
}

export async function callSendRoomCredentials(
  tid: string,
  mid: string
): Promise<SendCredentialsResponse> {
  if (!functions) {
    return {
      status: 'not_configured',
      message: 'Cloud Functions are not connected or emulator is offline.',
    };
  }

  try {
    const fn = httpsCallable<{ tid: string; mid: string }, SendCredentialsResponse>(
      functions,
      'sendRoomCredentials'
    );
    const result = await fn({ tid, mid });
    return result.data;
  } catch (err: any) {
    return {
      status: 'error',
      message: err?.message || 'Failed to dispatch room credentials.',
    };
  }
}

export async function callGenerateDemoData(): Promise<{ success: boolean; tournamentId: string; message: string }> {
  if (!functions) throw new Error('Firebase Functions is not configured');
  const fn = httpsCallable<void, { success: boolean; tournamentId: string; message: string }>(
    functions,
    'generateDemoData'
  );
  const result = await fn();
  return result.data;
}

export async function callDeleteAllData(
  confirmText: string,
  demoOnly = true
): Promise<DeleteDataResponse> {
  if (!functions) throw new Error('Firebase Functions is not configured');
  const fn = httpsCallable<{ confirm: string; demoOnly: boolean }, DeleteDataResponse>(
    functions,
    'deleteAllData'
  );
  const result = await fn({ confirm: confirmText, demoOnly });
  return result.data;
}
