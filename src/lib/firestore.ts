import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  type Query,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { stripUndefined } from './firestoreUtils';
import type {
  Game,
  Match,
  Member,
  Mode,
  Payment,
  Registration,
  Team,
  Tournament,
} from '../types';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'verified';

export type AuditTargetType =
  | 'tournament'
  | 'team'
  | 'member'
  | 'match'
  | 'registration'
  | 'payment'
  | 'admin_request'
  | 'system'
  | string;

export type NewTournament = Omit<Tournament, 'id' | 'createdAt'> & Partial<Tournament>;
export type NewTeam = Omit<Team, 'id'> & Partial<Team>;
export type NewMember = Omit<Member, 'id'> & Partial<Member>;
export type NewMatch = Omit<Match, 'id' | 'tournamentId'> & Partial<Match>;
export type NewRegistration = Omit<Registration, 'id' | 'createdAt' | 'status'> & {
  status?: Registration['status'];
};
export type NewPayment = Omit<Payment, 'id' | 'createdAt' | 'status'> & {
  status?: Registration['status'];
};

export interface RegistrationFilters {
  game?: Game;
  mode?: Mode;
  status?: Registration['status'];
  tournamentId?: string;
  paymentStatus?: Registration['paymentStatus'];
}

export interface PaymentFilters extends RegistrationFilters {
  registrationId?: string;
}

/* ------------------------------------------------------------------ */
/* Internal helpers                                                   */
/* ------------------------------------------------------------------ */

const MAX_BATCH_WRITES = 500;

export { stripUndefined };

/**
 * Recursively removes `undefined` values (Firestore rejects them).
 * Uses robust object traversal so deeply nested undefined fields are cleanly stripped.
 * @param value Any value.
 */
function clean<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (typeof value === 'object') {
    return stripUndefined(value as Record<string, unknown>) as unknown as T;
  }
  return value;
}

/**
 * Runs an async operation, logging failures with context before rethrowing.
 * @param label Human-readable operation name, e.g. "createTeam".
 * @param fn Operation to run.
 */
async function guarded<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[firestore] ${label} failed:`, err);
    throw err;
  }
}

/**
 * Converts a snapshot into a typed object that includes its document id.
 * @param snap Document or query-document snapshot.
 */
export function mapDoc<T extends { id: string }>(snap: DocumentSnapshot<DocumentData>): T {
  return { ...(snap.data() ?? {}), id: snap.id } as unknown as T;
}

/** Sort helper: oldest first. */
export function byCreatedAsc<
  T extends { createdAt?: string | number; registeredAt?: string; submittedAt?: string; paidAt?: string }
>(a: T, b: T): number {
  const timeA = new Date(a.createdAt || a.registeredAt || a.submittedAt || a.paidAt || 0).getTime();
  const timeB = new Date(b.createdAt || b.registeredAt || b.submittedAt || b.paidAt || 0).getTime();
  return timeA - timeB;
}

/** Sort helper: newest first. */
export function byCreatedDesc<
  T extends { createdAt?: string | number; registeredAt?: string; submittedAt?: string; paidAt?: string }
>(a: T, b: T): number {
  const timeA = new Date(a.createdAt || a.registeredAt || a.submittedAt || a.paidAt || 0).getTime();
  const timeB = new Date(b.createdAt || b.registeredAt || b.submittedAt || b.paidAt || 0).getTime();
  return timeB - timeA;
}

/** Sort helper: ascending match number. */
export function byMatchNumber(a: Match, b: Match): number {
  const numA = (a as any).matchNumber ?? a.roundNumber ?? 0;
  const numB = (b as any).matchNumber ?? b.roundNumber ?? 0;
  return numA - numB;
}

/**
 * Deletes document references in batches of at most 500 (Firestore's limit).
 * Anything that fits in one batch (e.g. a team and its members) is deleted atomically.
 * Refs are committed in order, so put parents last.
 * @param refs Documents to delete.
 */
async function commitDeletes(refs: DocumentReference[]): Promise<void> {
  for (let i = 0; i < refs.length; i += MAX_BATCH_WRITES) {
    const batch = writeBatch(db);
    refs.slice(i, i + MAX_BATCH_WRITES).forEach((r) => batch.delete(r));
    await batch.commit();
  }
}

/**
 * Builds a query from equality filters, ignoring empty values.
 * Sorting happens client-side so no composite indexes are required.
 * @param col Collection to query.
 * @param filters Field/value pairs.
 */
function filteredQuery(col: CollectionReference<DocumentData>, filters: object = {}): Query<DocumentData> {
  const clauses = Object.entries(filters as Record<string, string | undefined>)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => where(k, '==', v));
  return clauses.length > 0 ? query(col, ...clauses) : col;
}

/* ------------------------------------------------------------------ */
/* Path / query builders (shared with the real-time hooks)            */
/* ------------------------------------------------------------------ */

/** @returns /tournaments collection. */
export function tournamentsCol(): CollectionReference<DocumentData> {
  return collection(db, 'tournaments');
}
/** @returns /tournaments/{id} document. */
export function tournamentDoc(id: string): DocumentReference<DocumentData> {
  return doc(db, 'tournaments', id);
}
/** @returns /tournaments/{tid}/teams collection. */
export function teamsCol(tid: string): CollectionReference<DocumentData> {
  return collection(db, 'tournaments', tid, 'teams');
}
/** @returns /tournaments/{tid}/teams/{teamId} document. */
export function teamDoc(tid: string, teamId: string): DocumentReference<DocumentData> {
  return doc(db, 'tournaments', tid, 'teams', teamId);
}
/** @returns members collection of a team. */
export function membersCol(tid: string, teamId: string): CollectionReference<DocumentData> {
  return collection(db, 'tournaments', tid, 'teams', teamId, 'members');
}
/** @returns /tournaments/{tid}/matches collection. */
export function matchesCol(tid: string): CollectionReference<DocumentData> {
  return collection(db, 'tournaments', tid, 'matches');
}
/** @returns Tournaments query, optionally filtered by game. */
export function tournamentsQuery(game?: Game): Query<DocumentData> {
  return filteredQuery(tournamentsCol(), { game });
}
/** @returns Registrations query for the given filters. */
export function registrationsQuery(filters: RegistrationFilters = {}): Query<DocumentData> {
  return filteredQuery(collection(db, 'registrations'), filters);
}
/** @returns Payments query for the given filters. */
export function paymentsQuery(filters: PaymentFilters = {}): Query<DocumentData> {
  return filteredQuery(collection(db, 'payments'), filters);
}

/* ------------------------------------------------------------------ */
/* Audit                                                              */
/* ------------------------------------------------------------------ */

/**
 * Appends an entry to /audit with the current user's email and a timestamp.
 * Never throws: an audit failure must not undo or mask the write it describes.
 * @param action e.g. "team.delete".
 * @param targetType Kind of document affected.
 * @param targetId Id of the affected document.
 * @param payload Extra details (changed fields, counts, ...).
 */
export async function logAudit(
  action: string,
  targetType: AuditTargetType,
  targetId: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  try {
    const user = auth.currentUser;
    await addDoc(
      collection(db, 'audit'),
      clean({
        action,
        targetType,
        targetId,
        payload: clean(payload),
        adminEmail: user?.email ?? 'unknown',
        adminUid: user?.uid ?? null,
        createdAt: Date.now(),
        serverTime: serverTimestamp(),
      }),
    );
  } catch (err) {
    console.error(`[firestore] logAudit(${action}) failed:`, err);
  }
}

/* ------------------------------------------------------------------ */
/* Tournaments                                                        */
/* ------------------------------------------------------------------ */

/**
 * Fetches tournaments (newest first), optionally for one game.
 * @param game Optional game filter.
 */
export function getTournaments(game?: Game): Promise<Tournament[]> {
  return guarded('getTournaments', async () => {
    const snap = await getDocs(tournamentsQuery(game));
    return snap.docs.map((d) => mapDoc<Tournament>(d)).sort(byCreatedDesc);
  });
}

/**
 * Fetches one tournament.
 * @param id Tournament id.
 * @returns The tournament or null if missing.
 */
export function getTournament(id: string): Promise<Tournament | null> {
  return guarded('getTournament', async () => {
    const snap = await getDoc(tournamentDoc(id));
    return snap.exists() ? mapDoc<Tournament>(snap) : null;
  });
}

/**
 * Creates a tournament.
 * @param data Tournament fields (id and createdAt are generated).
 */
export function createTournament(data: Partial<Tournament> | NewTournament): Promise<string> {
  return guarded('createTournament', async () => {
    const payload = clean({ status: 'Open', mode: 'BR', numMatches: 0, ...data, createdAt: Date.now() });
    const ref = await addDoc(tournamentsCol(), payload);
    await logAudit('tournament.create', 'tournament', ref.id, payload);
    return ref.id;
  });
}

/**
 * Updates tournament fields.
 * @param id Tournament id.
 * @param data Fields to change.
 */
export function updateTournament(id: string, data: Partial<Omit<Tournament, 'id'>> | Record<string, any>): Promise<void> {
  return guarded('updateTournament', async () => {
    const payload = clean(data);
    await updateDoc(tournamentDoc(id), payload);
    await logAudit('tournament.update', 'tournament', id, { fields: payload });
  });
}

/**
 * Deletes a tournament and everything under it (teams, members, matches).
 * @param id Tournament id.
 */
export function deleteTournament(id: string): Promise<void> {
  return guarded('deleteTournament', async () => {
    const [teamsSnap, matchesSnap] = await Promise.all([getDocs(teamsCol(id)), getDocs(matchesCol(id))]);
    const memberSnaps = await Promise.all(teamsSnap.docs.map((t) => getDocs(membersCol(id, t.id))));
    const refs: DocumentReference[] = [
      ...memberSnaps.flatMap((s) => s.docs.map((d) => d.ref)),
      ...teamsSnap.docs.map((d) => d.ref),
      ...matchesSnap.docs.map((d) => d.ref),
      tournamentDoc(id),
    ];
    await commitDeletes(refs);
    await logAudit('tournament.delete', 'tournament', id, {
      teams: teamsSnap.size,
      members: memberSnaps.reduce((n, s) => n + s.size, 0),
      matches: matchesSnap.size,
    });
  });
}

/* ------------------------------------------------------------------ */
/* Teams                                                              */
/* ------------------------------------------------------------------ */

/**
 * Fetches all teams of a tournament (oldest first).
 * @param tournamentId Tournament id.
 */
export function getTeams(tournamentId: string): Promise<Team[]> {
  return guarded('getTeams', async () => {
    const snap = await getDocs(teamsCol(tournamentId));
    return snap.docs.map((d) => mapDoc<Team>(d)).sort(byCreatedAsc);
  });
}

/**
 * Fetches one team.
 * @returns The team or null if missing.
 */
export function getTeam(tournamentId: string, teamId: string): Promise<Team | null> {
  return guarded('getTeam', async () => {
    const snap = await getDoc(teamDoc(tournamentId, teamId));
    return snap.exists() ? mapDoc<Team>(snap) : null;
  });
}

/**
 * Creates a team (points/kills default to 0).
 * @param tournamentId Parent tournament.
 * @param data Team fields.
 */
export function createTeam(tournamentId: string, data: Partial<Team> | NewTeam): Promise<string> {
  return guarded('createTeam', async () => {
    const payload = clean({ totalPoints: 0, totalKills: 0, mode: 'BR', ...data, createdAt: Date.now() });
    const ref = await addDoc(teamsCol(tournamentId), payload);
    await logAudit('team.create', 'team', ref.id, { tournamentId, ...payload });
    return ref.id;
  });
}

/**
 * Updates team fields.
 * @param tournamentId Parent tournament.
 * @param teamId Team id.
 * @param data Fields to change.
 */
export function updateTeam(tournamentId: string, teamId: string, data: Partial<Omit<Team, 'id'>>): Promise<void> {
  return guarded('updateTeam', async () => {
    const payload = clean(data);
    await updateDoc(teamDoc(tournamentId, teamId), payload);
    await logAudit('team.update', 'team', teamId, { tournamentId, fields: payload });
  });
}

export function disqualifyTeam(
  tournamentId: string,
  teamId: string,
  reason: string,
  adminEmail: string,
): Promise<void> {
  return guarded('disqualifyTeam', async () => {
    await updateTeam(tournamentId, teamId, {
      disqualified: true,
      disqualifiedAt: new Date().toISOString(),
      disqualifiedBy: adminEmail,
      disqualificationReason: reason,
    } as any);
    await logAudit('team.disqualify', 'team', teamId, {
      tournamentId,
      reason,
      adminEmail,
    });
  });
}

export function reinstateTeam(
  tournamentId: string,
  teamId: string,
): Promise<void> {
  return guarded('reinstateTeam', async () => {
    await updateTeam(tournamentId, teamId, {
      disqualified: false,
      disqualifiedAt: null,
      disqualifiedBy: null,
      disqualificationReason: null,
    } as any);
    await logAudit('team.reinstate', 'team', teamId, { tournamentId });
  });
}

/**
 * Collects the document refs needed to remove teams: all their members, then the teams.
 * @param tournamentId Parent tournament.
 * @param teamIds Teams to remove.
 */
async function collectTeamDeleteRefs(
  tournamentId: string,
  teamIds: string[],
): Promise<{ refs: DocumentReference[]; memberCount: number }> {
  const memberSnaps = await Promise.all(teamIds.map((id) => getDocs(membersCol(tournamentId, id))));
  const memberRefs = memberSnaps.flatMap((s) => s.docs.map((d) => d.ref));
  const teamRefs = teamIds.map((id) => teamDoc(tournamentId, id));
  return { refs: [...memberRefs, ...teamRefs], memberCount: memberRefs.length };
}

/**
 * Deletes a team and all its members in one atomic writeBatch
 * (fixes the "can't delete team" bug where member subcollections were orphaned).
 * @param tournamentId Parent tournament.
 * @param teamId Team id.
 */
export function deleteTeam(tournamentId: string, teamId: string): Promise<void> {
  return guarded('deleteTeam', async () => {
    const { refs, memberCount } = await collectTeamDeleteRefs(tournamentId, [teamId]);
    await commitDeletes(refs);
    await logAudit('team.delete', 'team', teamId, { tournamentId, members: memberCount });
  });
}

/**
 * Bulk-deletes teams (and their members).
 * @param tournamentId Parent tournament.
 * @param teamIds Teams to delete.
 */
export function deleteTeams(tournamentId: string, teamIds: string[]): Promise<void> {
  return guarded('deleteTeams', async () => {
    if (teamIds.length === 0) return;
    const { refs, memberCount } = await collectTeamDeleteRefs(tournamentId, teamIds);
    await commitDeletes(refs);
    await logAudit('team.bulkDelete', 'team', teamIds.join(','), { tournamentId, teams: teamIds.length, members: memberCount });
  });
}

/* ------------------------------------------------------------------ */
/* Members                                                            */
/* ------------------------------------------------------------------ */

/**
 * Fetches a team's members.
 * @param tournamentId Parent tournament.
 * @param teamId Team id.
 */
export function getMembers(tournamentId: string, teamId: string): Promise<Member[]> {
  return guarded('getMembers', async () => {
    const snap = await getDocs(membersCol(tournamentId, teamId));
    return snap.docs.map((d) => mapDoc<Member>(d));
  });
}

/**
 * Adds a member to a team.
 * @param data Member fields.
 */
export function createMember(tournamentId: string, teamId: string, data: Partial<Member> | NewMember): Promise<string> {
  return guarded('createMember', async () => {
    const payload = clean({ isCaptain: false, isSubstitute: false, ...data, joinedAt: new Date().toISOString() });
    const ref = await addDoc(membersCol(tournamentId, teamId), payload);
    await logAudit('member.create', 'member', ref.id, { tournamentId, teamId, ...payload });
    return ref.id;
  });
}

/**
 * Updates a member.
 * @param data Fields to change.
 */
export function updateMember(
  tournamentId: string,
  teamId: string,
  memberId: string,
  data: Partial<Omit<Member, 'id'>>,
): Promise<void> {
  return guarded('updateMember', async () => {
    const payload = clean(data);
    await updateDoc(doc(db, 'tournaments', tournamentId, 'teams', teamId, 'members', memberId), payload);
    await logAudit('member.update', 'member', memberId, { tournamentId, teamId, fields: payload });
  });
}

/** Deletes one member from a team. */
export function deleteMember(tournamentId: string, teamId: string, memberId: string): Promise<void> {
  return guarded('deleteMember', async () => {
    await deleteDoc(doc(db, 'tournaments', tournamentId, 'teams', teamId, 'members', memberId));
    await logAudit('member.delete', 'member', memberId, { tournamentId, teamId });
  });
}

/* ------------------------------------------------------------------ */
/* Matches                                                            */
/* ------------------------------------------------------------------ */

/**
 * Fetches matches ordered by match number.
 * @param tournamentId Parent tournament.
 */
export function getMatches(tournamentId: string): Promise<Match[]> {
  return guarded('getMatches', async () => {
    const snap = await getDocs(matchesCol(tournamentId));
    return snap.docs.map((d) => mapDoc<Match>(d)).sort(byMatchNumber);
  });
}

/**
 * Fetches one match.
 * @returns The match or null if missing.
 */
export function getMatch(tournamentId: string, matchId: string): Promise<Match | null> {
  return guarded('getMatch', async () => {
    const snap = await getDoc(doc(db, 'tournaments', tournamentId, 'matches', matchId));
    return snap.exists() ? mapDoc<Match>(snap) : null;
  });
}

/**
 * Creates a match.
 * @param tournamentId Parent tournament.
 * @param data Match fields (tournamentId is filled in).
 */
export function createMatch(tournamentId: string, data: Partial<Match> | NewMatch): Promise<string> {
  return guarded('createMatch', async () => {
    const payload = clean({ scheduledAt: new Date().toISOString(), status: 'scheduled', teamARoundWins: 0, teamBRoundWins: 0, ...data, tournamentId });
    const ref = await addDoc(matchesCol(tournamentId), payload);
    await logAudit('match.create', 'match', ref.id, payload);
    return ref.id;
  });
}

/**
 * Updates a match.
 * @param data Fields to change.
 */
export function updateMatch(tournamentId: string, matchId: string, data: Partial<Omit<Match, 'id'>>): Promise<void> {
  return guarded('updateMatch', async () => {
    const payload = clean(data);
    await updateDoc(doc(db, 'tournaments', tournamentId, 'matches', matchId), payload);
    await logAudit('match.update', 'match', matchId, { tournamentId, fields: payload });
  });
}

/** Deletes a match. */
export function deleteMatch(tournamentId: string, matchId: string): Promise<void> {
  return guarded('deleteMatch', async () => {
    await deleteDoc(doc(db, 'tournaments', tournamentId, 'matches', matchId));
    await logAudit('match.delete', 'match', matchId, { tournamentId });
  });
}

/* ------------------------------------------------------------------ */
/* Registrations & Local Cache                                        */
/* ------------------------------------------------------------------ */

export function getDeletedRegistrationIds(): Set<string> {
  try {
    const raw = localStorage.getItem('ttp_registrations_deleted');
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

export function getLocalRegistrationsList(): Registration[] {
  try {
    const raw = localStorage.getItem('ttp_registrations_cache');
    if (raw) {
      const parsed = JSON.parse(raw) as Registration[];
      const deletedIds = getDeletedRegistrationIds();
      return parsed.filter((r) => !deletedIds.has(r.id));
    }
  } catch {}
  return [];
}

export function saveAllLocalRegistrations(list: Registration[]): void {
  try {
    localStorage.setItem('ttp_registrations_cache', JSON.stringify(list.slice(0, 300)));
  } catch {}
}

export function saveLocalRegistrationItem(reg: Registration): void {
  try {
    const raw = localStorage.getItem('ttp_registrations_cache') || '[]';
    const list = JSON.parse(raw) as Registration[];
    const filtered = list.filter((r) => r.id !== reg.id);
    filtered.unshift(reg);
    localStorage.setItem('ttp_registrations_cache', JSON.stringify(filtered.slice(0, 300)));
    window.dispatchEvent(new Event('ttp_registrations_updated'));
  } catch {}
}

/**
 * Fetches registrations (newest first).
 * @param filters Optional game / status / tournamentId filters.
 */
export function getRegistrations(filters: RegistrationFilters = {}): Promise<Registration[]> {
  return guarded('getRegistrations', async () => {
    const snap = await getDocs(registrationsQuery(filters));
    return snap.docs.map((d) => mapDoc<Registration>(d)).sort(byCreatedDesc);
  });
}

/**
 * Creates a registration (status defaults to "pending").
 * @param data Registration fields.
 */
export function createRegistration(data: Partial<Registration> | NewRegistration): Promise<string> {
  return guarded('createRegistration', async () => {
    const payload = clean({ status: 'pending' as ReviewStatus, paymentStatus: 'pending_verification', ...data, createdAt: Date.now(), submittedAt: new Date().toISOString() });
    const ref = await addDoc(collection(db, 'registrations'), payload);
    await logAudit('registration.create', 'registration', ref.id, { tournamentId: (payload as any).tournamentId, teamName: (payload as any).teamName });
    saveLocalRegistrationItem({ ...payload, id: ref.id } as Registration);
    return ref.id;
  });
}

/**
 * Updates a registration (e.g. approve / reject).
 * @param data Fields to change.
 */
export function updateRegistration(id: string, data: Partial<Omit<Registration, 'id'>>): Promise<void> {
  return guarded('updateRegistration', async () => {
    const payload = clean(data);
    await updateDoc(doc(db, 'registrations', id), payload);
    await logAudit('registration.update', 'registration', id, { fields: payload });
  });
}

/** Deletes a registration. */
export function deleteRegistration(id: string): Promise<void> {
  return guarded('deleteRegistration', async () => {
    try {
      const deleted = getDeletedRegistrationIds();
      deleted.add(id);
      localStorage.setItem('ttp_registrations_deleted', JSON.stringify(Array.from(deleted)));
      const raw = localStorage.getItem('ttp_registrations_cache') || '[]';
      const list = JSON.parse(raw) as Registration[];
      const filtered = list.filter((r) => r.id !== id);
      localStorage.setItem('ttp_registrations_cache', JSON.stringify(filtered));
      window.dispatchEvent(new Event('ttp_registrations_updated'));
    } catch {}

    await deleteDoc(doc(db, 'registrations', id));
    await logAudit('registration.delete', 'registration', id);
  });
}

/* ------------------------------------------------------------------ */
/* Payments                                                           */
/* ------------------------------------------------------------------ */

/**
 * Fetches payments (newest first).
 * @param filters Optional game / status / tournamentId / registrationId filters.
 */
export function getPayments(filters: PaymentFilters = {}): Promise<Payment[]> {
  return guarded('getPayments', async () => {
    const snap = await getDocs(paymentsQuery(filters));
    return snap.docs.map((d) => mapDoc<Payment>(d)).sort(byCreatedDesc);
  });
}

/**
 * Creates a payment record (status defaults to "pending").
 * @param data Payment fields.
 */
export function createPayment(data: Partial<Payment> | NewPayment): Promise<string> {
  return guarded('createPayment', async () => {
    const payload = clean({ status: 'pending' as ReviewStatus, ...data, createdAt: Date.now(), paidAt: new Date().toISOString() });
    const ref = await addDoc(collection(db, 'payments'), payload);
    await logAudit('payment.create', 'payment', ref.id, { registrationId: (payload as any).registrationId, amount: (payload as any).amount });
    return ref.id;
  });
}

/**
 * Updates a payment (e.g. verify / reject).
 * @param data Fields to change.
 */
export function updatePayment(id: string, data: Partial<Omit<Payment, 'id'>>): Promise<void> {
  return guarded('updatePayment', async () => {
    const payload = clean(data);
    await updateDoc(doc(db, 'payments', id), payload);
    await logAudit('payment.update', 'payment', id, { fields: payload });
  });
}

/** Deletes a payment. */
export function deletePayment(id: string): Promise<void> {
  return guarded('deletePayment', async () => {
    await deleteDoc(doc(db, 'payments', id));
    await logAudit('payment.delete', 'payment', id);
  });
}
