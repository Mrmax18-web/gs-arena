import {
  collection,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
  setDoc,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { registrationConverter } from '../lib/converters';
import { Registration, ApprovalStatus, PaymentStatus } from '../types/registration';
import { RegistrationFormInput } from '../lib/validators';
import { RULES_VERSION } from '../lib/rulesConstants';

export async function submitRegistration(
  input: RegistrationFormInput,
  ownerUid: string
): Promise<string> {
  if (!db) throw new Error('Firestore is not initialized');

  const cleanOtr = input.otr.trim().toUpperCase();
  const regCol = collection(db, 'registrations').withConverter(registrationConverter);

  // 1. Check for duplicate team name in this tournament
  try {
    const nameQuery = query(
      regCol,
      where('tournamentId', '==', input.tournamentId),
      where('teamName', '==', input.teamName.trim())
    );
    const nameSnap = await getDocs(nameQuery);
    if (!nameSnap.empty) {
      throw new Error(`A team named "${input.teamName}" has already registered for this tournament.`);
    }
  } catch (err: any) {
    if (err?.message?.includes('has already registered')) {
      throw err;
    }
    console.warn('[Registration] Duplicate name check fallback:', err?.message);
  }

  const newDoc = doc(regCol);
  const now = new Date().toISOString();

  // 2. Transactional OTR claim check & registration write
  const otrClaimRef = doc(db, 'tournaments', input.tournamentId, 'otrClaims', cleanOtr);

  const registration: Registration = {
    id: newDoc.id,
    tournamentId: input.tournamentId,
    teamName: input.teamName.trim(),
    leaderEmail: input.leaderEmail.trim().toLowerCase(),
    players: input.players.map((p) => p.trim()),
    ownerUid,
    status: 'pending',
    approvalStatus: 'pending',
    paymentStatus: 'pending',
    otr: cleanOtr,
    paymentScreenshotUrl: input.paymentScreenshotUrl || '',
    teamLogoUrl: input.teamLogoUrl?.trim() || undefined,
    rulesVersion: RULES_VERSION,
    acceptedAt: now,
    createdAt: now,
  };

  try {
    await runTransaction(db, async (tx) => {
      const otrSnap = await tx.get(otrClaimRef);
      if (otrSnap.exists()) {
        throw new Error(`The OTR "${cleanOtr}" has already been used for this tournament. Please provide a unique transaction reference.`);
      }

      // Set OTR claim document
      tx.set(otrClaimRef, {
        otr: cleanOtr,
        tournamentId: input.tournamentId,
        registrationId: newDoc.id,
        ownerUid,
        claimedAt: now,
      });

      tx.set(newDoc, registration);
    });
  } catch (txErr: any) {
    if (txErr?.message?.includes('already been used')) {
      throw txErr;
    }
    console.warn('[Registration] OTR transaction fallback, writing registration directly:', txErr?.message);
    await setDoc(newDoc, registration);
  }

  return newDoc.id;
}

export async function reviewApproval(
  rid: string,
  approvalStatus: ApprovalStatus,
  reviewerUid: string,
  note?: string
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');

  const regRef = doc(db, 'registrations', rid);
  await updateDoc(regRef, {
    approvalStatus,
    status: approvalStatus,
    reviewedBy: reviewerUid,
    reviewedAt: new Date().toISOString(),
    reviewNote: note || null,
    updatedAt: new Date().toISOString(),
  });
}

export async function reviewPayment(
  rid: string,
  paymentStatus: PaymentStatus,
  reviewerUid: string,
  note?: string
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');

  const regRef = doc(db, 'registrations', rid);
  await updateDoc(regRef, {
    paymentStatus,
    paymentReviewedBy: reviewerUid,
    paymentReviewedAt: new Date().toISOString(),
    paymentReviewNote: note || null,
    updatedAt: new Date().toISOString(),
  });
}

export async function reviewRegistration(
  rid: string,
  status: ApprovalStatus,
  reviewerUid: string,
  note?: string
): Promise<void> {
  return reviewApproval(rid, status, reviewerUid, note);
}

