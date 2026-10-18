import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../shared/firebaseAdmin.js';
import { z } from 'zod';

const RequestSchema = z.object({
  confirm: z.string(),
  demoOnly: z.boolean().default(true),
});

export const deleteAllData = onCall(async (request) => {
  // 1. Verify caller has creator role
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }

  const callerRole = request.auth.token?.role;
  if (callerRole !== 'creator') {
    throw new HttpsError(
      'permission-denied',
      'Only the Platform Creator may wipe tournament databases.'
    );
  }

  const parsed = RequestSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'Invalid wipe parameters.');
  }

  const { confirm, demoOnly } = parsed.data;

  // If full wipe requested, require exact phrase
  if (!demoOnly && confirm.trim() !== 'DELETE ALL DATA') {
    throw new HttpsError(
      'invalid-argument',
      'Confirmation phrase must match "DELETE ALL DATA" exactly.'
    );
  }

  let deletedTournaments = 0;
  let deletedRegistrations = 0;
  let deletedSecrets = 0;
  let deletedContacts = 0;

  if (demoOnly) {
    // 1. Delete tournaments where isDemo == true (along with subcollections matches, teams)
    const demoTourneys = await db.collection('tournaments').where('isDemo', '==', true).get();
    for (const doc of demoTourneys.docs) {
      await db.recursiveDelete(doc.ref);
      deletedTournaments++;
    }
  } else {
    // 2. Full Wipe: Tournaments, Registrations, Match Secrets, Contact Messages
    // NEVER touches users, config, adminRequests, or auth accounts
    const tourneys = await db.collection('tournaments').get();
    for (const doc of tourneys.docs) {
      await db.recursiveDelete(doc.ref);
      deletedTournaments++;
    }

    const regs = await db.collection('registrations').get();
    for (const doc of regs.docs) {
      await doc.ref.delete();
      deletedRegistrations++;
    }

    const secrets = await db.collection('matchSecrets').get();
    for (const doc of secrets.docs) {
      await doc.ref.delete();
      deletedSecrets++;
    }

    const contacts = await db.collection('contactMessages').get();
    for (const doc of contacts.docs) {
      await doc.ref.delete();
      deletedContacts++;
    }
  }

  const now = new Date().toISOString();

  // Audit entry
  await db.collection('auditLogs').add({
    action: demoOnly ? 'PURGE_DEMO_DATA' : 'PURGE_ALL_DATA',
    performedBy: request.auth.uid,
    deletedTournaments,
    deletedRegistrations,
    deletedSecrets,
    deletedContacts,
    timestamp: now,
  });

  return {
    success: true,
    deletedCounts: {
      tournaments: deletedTournaments,
      registrations: deletedRegistrations,
      matchSecrets: deletedSecrets,
      contactMessages: deletedContacts,
    },
    message: demoOnly
      ? `Purged ${deletedTournaments} demo tournament(s) and associated records.`
      : `Wiped all tournament databases (${deletedTournaments} tournaments, ${deletedRegistrations} registrations).`,
  };
});
