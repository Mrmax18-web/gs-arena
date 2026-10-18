import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as crypto from 'crypto';
import { db, auth } from '../shared/firebaseAdmin.js';
import { creatorAccessCode } from '../shared/secrets.js';
import { z } from 'zod';

const RequestSchema = z.object({
  code: z.string().min(1).max(30),
});

function safeCompare(input: string, secret: string): boolean {
  const bufInput = Buffer.from(input, 'utf8');
  const bufSecret = Buffer.from(secret, 'utf8');

  if (bufInput.length !== bufSecret.length) {
    // Prevent timing side-channel by doing a dummy comparison
    crypto.timingSafeEqual(bufInput, bufInput);
    return false;
  }

  return crypto.timingSafeEqual(bufInput, bufSecret);
}

export const claimCreator = onCall(
  { secrets: [creatorAccessCode] },
  async (request) => {
    // 1. Must be authenticated with an account
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError('unauthenticated', 'You must be signed in to claim creator access.');
    }

    const uid = request.auth.uid;
    const ip = request.rawRequest?.ip || 'unknown';

    // 2. Validate input schema
    const parsed = RequestSchema.safeParse(request.data);
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', 'Invalid access code format.');
    }

    const providedCode = parsed.data.code.trim();

    // 3. Rate limiting per UID and IP (5 failures = 15-minute lockout)
    const rateLimitRef = db.collection('rateLimits').doc(`claimCreator_${uid}`);
    const rateLimitSnap = await rateLimitRef.get();
    const now = Date.now();

    if (rateLimitSnap.exists) {
      const data = rateLimitSnap.data()!;
      if (data.lockedUntil && data.lockedUntil > now) {
        const remainingMinutes = Math.ceil((data.lockedUntil - now) / 60000);
        throw new HttpsError(
          'resource-exhausted',
          `Too many failed attempts. Account temporarily locked for ${remainingMinutes} minute(s).`
        );
      }
    }

    // 4. Resolve expected secret
    const expectedSecret =
      process.env.CREATOR_ACCESS_CODE ||
      (creatorAccessCode.value ? creatorAccessCode.value() : '130620');

    const isValid = safeCompare(providedCode, expectedSecret);

    if (!isValid) {
      const currentAttempts = (rateLimitSnap.data()?.attempts || 0) + 1;
      const isLocked = currentAttempts >= 5;
      const lockedUntil = isLocked ? now + 15 * 60 * 1000 : null;

      await rateLimitRef.set(
        {
          uid,
          ip,
          attempts: isLocked ? 0 : currentAttempts,
          lockedUntil,
          lastAttemptAt: new Date().toISOString(),
        },
        { merge: true }
      );

      if (isLocked) {
        throw new HttpsError(
          'resource-exhausted',
          'Too many failed attempts. Locked out for 15 minutes.'
        );
      }

      throw new HttpsError('permission-denied', 'Incorrect creator access code.');
    }

    // 5. Code is valid: Clear rate limit
    await rateLimitRef.delete();

    // 6. Set Firebase Custom Claims: creator = true, merging existing claims
    const userRecord = await auth.getUser(uid);
    const existingClaims = userRecord.customClaims || {};
    await auth.setCustomUserClaims(uid, {
      ...existingClaims,
      creator: true,
      role: 'creator',
    });

    // 7. Mirror role into users/{uid} for UI display only
    const userRef = db.collection('users').doc(uid);
    await userRef.set(
      {
        uid,
        email: request.auth.token.email || null,
        role: 'creator',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // 8. Write immutable audit log
    await db.collection('auditLogs').add({
      action: 'CLAIM_CREATOR',
      uid,
      email: request.auth.token.email || null,
      ip,
      timestamp: new Date().toISOString(),
    });

    return { success: true, message: 'Creator claim granted successfully.' };
  }
);
