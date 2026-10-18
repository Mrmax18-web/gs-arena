import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, auth } from '../shared/firebaseAdmin.js';
import { z } from 'zod';

const RequestSchema = z.object({
  uid: z.string().min(1),
  decision: z.enum(['approve', 'reject']),
  reviewNote: z.string().max(500).optional(),
});

export const reviewAdminRequest = onCall(async (request) => {
  // 1. Verify caller is authenticated and possesses 'creator' claim
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }

  const isCreatorCaller =
    request.auth.token?.creator === true || request.auth.token?.role === 'creator';
  if (!isCreatorCaller) {
    throw new HttpsError(
      'permission-denied',
      'Only verified Creators may approve or reject administrator requests.'
    );
  }

  // 2. Validate arguments
  const parsed = RequestSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'Invalid request parameters.');
  }

  const { uid, decision, reviewNote } = parsed.data;
  const adminReqRef = db.collection('adminRequests').doc(uid);
  const snap = await adminReqRef.get();

  if (!snap.exists) {
    throw new HttpsError('not-found', 'Admin application not found.');
  }

  const now = new Date().toISOString();

  if (decision === 'approve') {
    // Set custom claim: admin = true, merging existing claims
    const targetUser = await auth.getUser(uid);
    const existingClaims = targetUser.customClaims || {};
    await auth.setCustomUserClaims(uid, {
      ...existingClaims,
      admin: true,
      role: existingClaims.creator ? 'creator' : 'admin',
    });

    // Update users/{uid} mirror doc
    await db.collection('users').doc(uid).set(
      {
        role: 'admin',
        updatedAt: now,
      },
      { merge: true }
    );

    // Update adminRequests/{uid}
    await adminReqRef.update({
      status: 'approved',
      reviewedBy: request.auth.uid,
      reviewedAt: now,
      reviewNote: reviewNote || null,
    });

    // Write audit log
    await db.collection('auditLogs').add({
      action: 'APPROVE_ADMIN',
      targetUid: uid,
      performedBy: request.auth.uid,
      timestamp: now,
    });

    return { success: true, message: `User ${uid} approved as admin.` };
  } else {
    // Reject
    await adminReqRef.update({
      status: 'rejected',
      reviewedBy: request.auth.uid,
      reviewedAt: now,
      reviewNote: reviewNote || null,
    });

    await db.collection('auditLogs').add({
      action: 'REJECT_ADMIN',
      targetUid: uid,
      performedBy: request.auth.uid,
      timestamp: now,
    });

    return { success: true, message: `User ${uid} application rejected.` };
  }
});
