import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../shared/firebaseAdmin.js';
import {
  smtpHost,
  smtpPort,
  smtpUser,
  smtpPass,
  mailFrom,
} from '../shared/secrets.js';
import { isSmtpConfigured, sendIndividualEmail } from '../email/mailer.js';
import { z } from 'zod';

const RequestSchema = z.object({
  tid: z.string().min(1),
  mid: z.string().min(1),
});

export const sendRoomCredentials = onCall(
  { secrets: [smtpHost, smtpPort, smtpUser, smtpPass, mailFrom] },
  async (request) => {
    // 1. Verify caller has admin or creator role
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError('unauthenticated', 'You must be signed in.');
    }

    const callerRole = request.auth.token?.role;
    if (callerRole !== 'admin' && callerRole !== 'creator') {
      throw new HttpsError(
        'permission-denied',
        'Only tournament administrators or creators may dispatch room credentials.'
      );
    }

    // 2. Validate input
    const parsed = RequestSchema.safeParse(request.data);
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', 'Missing tournament or match ID.');
    }

    const { tid, mid } = parsed.data;

    // 3. Verify match exists
    const matchSnap = await db.collection('tournaments').doc(tid).collection('matches').doc(mid).get();
    if (!matchSnap.exists) {
      throw new HttpsError('not-found', 'Match does not exist.');
    }
    const matchData = matchSnap.data()!;

    // 4. Read match secrets (from private collection /matchSecrets/{mid})
    const secretSnap = await db.collection('matchSecrets').doc(mid).get();
    if (!secretSnap.exists || !secretSnap.data()?.roomId) {
      throw new HttpsError(
        'failed-precondition',
        'No room credentials (Room ID / Password) configured for this match yet.'
      );
    }

    const { roomId, roomPassword } = secretSnap.data()!;

    // 5. Query APPROVED registrations for this tournament
    const regQuery = await db
      .collection('registrations')
      .where('tournamentId', '==', tid)
      .where('status', '==', 'approved')
      .get();

    if (regQuery.empty) {
      throw new HttpsError(
        'failed-precondition',
        'No approved team registrations found for this tournament.'
      );
    }

    // 6. Check SMTP configuration
    const isConfigured = isSmtpConfigured();
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

    if (!isConfigured && !isEmulator) {
      return {
        status: 'not_configured',
        recipientCount: regQuery.size,
        message: 'SMTP email provider not configured in function secrets.',
      };
    }

    // 7. Send ONE individual email per leader (NEVER CC or exposed lists)
    let successCount = 0;
    let failedCount = 0;
    const deliveryResults: { email: string; success: boolean }[] = [];

    const tournamentSnap = await db.collection('tournaments').doc(tid).get();
    const tourneyName = tournamentSnap.data()?.name || 'Tournament';

    for (const regDoc of regQuery.docs) {
      const reg = regDoc.data();
      const leaderEmail = reg.leaderEmail;
      const teamName = reg.teamName;

      if (!leaderEmail) {
        failedCount++;
        continue;
      }

      const emailSubject = `[Match #${matchData.matchNumber}] Official Room Credentials - ${tourneyName}`;
      const emailBody = `
Hello Team Leader of ${teamName},

Here are your official room credentials for Match #${matchData.matchNumber}:
Tournament: ${tourneyName}
Map: ${matchData.map}
Scheduled Time: ${matchData.scheduledAt}

Room ID: ${roomId}
Password: ${roomPassword}

Please enter the custom lobby 10 minutes prior to match kickoff. Do not share these credentials with unauthorized parties.

Tournament Operations Team
      `.trim();

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px;">
          <h2 style="color: #DC2626; margin-top: 0;">Official Match Room Credentials</h2>
          <p>Hello Team Leader of <strong>${teamName}</strong>,</p>
          <p>Here are your match details for <strong>${tourneyName}</strong>:</p>
          <div style="background: rgba(255,255,255,0.08); padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Match:</strong> #${matchData.matchNumber} (${matchData.map})</p>
            <p style="margin: 4px 0;"><strong>Room ID:</strong> <span style="font-family: monospace; font-size: 16px; color: #fbbf24;">${roomId}</span></p>
            <p style="margin: 4px 0;"><strong>Password:</strong> <span style="font-family: monospace; font-size: 16px; color: #fbbf24;">${roomPassword}</span></p>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">Please enter the custom lobby 10 minutes prior to scheduled start.</p>
        </div>
      `;

      try {
        const sent = await sendIndividualEmail({
          to: leaderEmail,
          subject: emailSubject,
          text: emailBody,
          html: htmlBody,
        });

        if (sent) {
          successCount++;
          deliveryResults.push({ email: leaderEmail, success: true });
        } else {
          failedCount++;
          deliveryResults.push({ email: leaderEmail, success: false });
        }
      } catch (err) {
        console.error(`Error emailing leader ${leaderEmail}:`, err);
        failedCount++;
        deliveryResults.push({ email: leaderEmail, success: false });
      }
    }

    const now = new Date().toISOString();

    // 8. Record audit trail & set credentialsSentAt (NEVER store plaintext password in logs)
    await secretSnap.ref.update({
      credentialsSentAt: now,
      lastDispatchedBy: request.auth.uid,
      lastRecipientCount: successCount,
    });

    await db.collection('auditLogs').add({
      action: 'SEND_ROOM_CREDENTIALS',
      tid,
      mid,
      matchNumber: matchData.matchNumber,
      senderUid: request.auth.uid,
      totalRecipients: regQuery.size,
      successCount,
      failedCount,
      timestamp: now,
    });

    return {
      status: failedCount === 0 ? 'sent' : 'partial',
      recipientCount: regQuery.size,
      successCount,
      failedCount,
      message: `Dispatched credentials to ${successCount} leader(s).`,
    };
  }
);
