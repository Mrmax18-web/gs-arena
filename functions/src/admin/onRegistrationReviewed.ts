import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { db } from '../shared/firebaseAdmin.js';
import { sendIndividualEmail } from '../email/mailer.js';
import { ALL_SECRETS } from '../shared/secrets.js';

export const onRegistrationReviewed = onDocumentUpdated(
  {
    document: 'registrations/{rid}',
    secrets: ALL_SECRETS,
  },
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) return;

    const previousStatus = beforeData.status;
    const newStatus = afterData.status;

    // Idempotency: only act when status actually changes
    if (previousStatus === newStatus) return;

    const { tournamentId, teamName, leaderEmail, players, reviewNote } = afterData;

    // Fetch tournament title for email
    const tourneySnap = await db.collection('tournaments').doc(tournamentId).get();
    const tourneyName = tourneySnap.data()?.name || 'Tournament';

    if (newStatus === 'approved') {
      // 1. Create or update PUBLIC-SAFE team projection: tournaments/{tid}/teams/{teamId}
      // PUBLIC-SAFE: teamName and player display names ONLY (NO EMAILS)
      const teamId = event.params.rid; // deterministic teamId from registration ID
      const teamRef = db
        .collection('tournaments')
        .doc(tournamentId)
        .collection('teams')
        .doc(teamId);

      await teamRef.set(
        {
          id: teamId,
          tournamentId,
          teamName,
          players: players || [],
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // 2. Email Team Leader
      if (leaderEmail) {
        try {
          await sendIndividualEmail({
            to: leaderEmail,
            subject: `Team Approved: ${teamName} - ${tourneyName}`,
            text: `Congratulations! Your team "${teamName}" has been approved for "${tourneyName}". Room credentials will be sent prior to match kickoff.`,
            html: `
              <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px;">
                <h2 style="color: #10b981; margin-top: 0;">Application Approved!</h2>
                <p>Hello Team Leader,</p>
                <p>Your team <strong>${teamName}</strong> has been officially approved to compete in <strong>${tourneyName}</strong>.</p>
                <p>Official match room IDs and passwords will be delivered to this email before match times.</p>
              </div>
            `,
          });
        } catch (err) {
          console.error(`Failed to send approval email to ${leaderEmail}:`, err);
        }
      }
    } else if (newStatus === 'rejected') {
      if (leaderEmail) {
        try {
          await sendIndividualEmail({
            to: leaderEmail,
            subject: `Registration Status Update: ${teamName} - ${tourneyName}`,
            text: `Your registration for "${teamName}" in "${tourneyName}" was reviewed and not approved.${
              reviewNote ? ` Reason: ${reviewNote}` : ''
            }`,
            html: `
              <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px;">
                <h2 style="color: #f43f5e; margin-top: 0;">Registration Update</h2>
                <p>Hello Team Leader,</p>
                <p>Your team application for <strong>${teamName}</strong> in <strong>${tourneyName}</strong> could not be approved at this time.</p>
                ${reviewNote ? `<p style="color: #94a3b8;">Review Note: ${reviewNote}</p>` : ''}
              </div>
            `,
          });
        } catch (err) {
          console.error(`Failed to send rejection email to ${leaderEmail}:`, err);
        }
      }
    }
  }
);
