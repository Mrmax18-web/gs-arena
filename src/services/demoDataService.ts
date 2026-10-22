import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { syncTournamentAnalytics } from './tournamentService';
import { withTimeout } from '../lib/timeout';

const DEMO_TEAMS = [
  { name: 'Soul Esports', players: ['Mortal', 'Viper', 'Regaltos', 'Aman'] },
  { name: 'GodLike Esports', players: ['Jonathan', 'Zgod', 'Neyoo', 'ClutchGod'] },
  { name: 'Entity Gaming', players: ['Scout', 'Ghatak', 'Castillo', 'Secret'] },
  { name: 'Global Esports', players: ['Mavi', 'Ninja', 'Fury', 'Dark'] },
  { name: 'Team Tamilas', players: ['Raven', 'ViperTN', 'Kratos', 'Alpha'] },
  { name: 'Hydra Esports', players: ['Dynamo', 'Alpha', 'Ronnie', 'Heman'] },
  { name: '8Bit Gaming', players: ['MadMan', 'Juicy', 'Beast', 'Spower'] },
  { name: 'Blind Esports', players: ['Spower', 'Ronak', 'Maxi', 'Joker'] },
  { name: 'Revenant Esports', players: ['Apollo', 'Fierce', 'TopG', 'Sensei'] },
  { name: 'Orangutan Gaming', players: ['Ash', 'Wizzing', 'Drigger', 'Believe'] },
  { name: 'Gladiators Esports', players: ['Destro', 'Justin', 'DeltaPG', 'Shogun'] },
  { name: 'Team XSpark', players: ['Pukar', 'Sarang', 'Kilz', 'Dreams'] },
  { name: 'Medal Esports', players: ['Paradox', 'Kyoya', 'Sayyam', 'TopDawg'] },
  { name: 'Big Brother Esports', players: ['Saif', 'Uzi', 'Prince', 'General'] },
  { name: 'Enigma Gaming', players: ['Daljit', 'Rex', 'Trance', 'Veyron'] },
  { name: 'Gujarat Tigers', players: ['Shadow', 'Aj', 'PrinceGT', 'Wizz'] },
];

const MAPS = ['Erangel', 'Miramar', 'Sanhok', 'Vikendi', 'Erangel'];
const BGMI_PLACEMENT_POINTS = [0, 10, 6, 5, 4, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0];

export interface DeleteDataResult {
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

/**
 * Populates a complete mock tournament with 16 teams and 5 completed matches.
 * Uses writeBatch (max 450 writes/batch) respecting the 500-write limit.
 * Guaranteed not to generate demo data in production environments.
 */
export async function generateDemoData(): Promise<{
  success: boolean;
  tournamentId: string;
  message: string;
}> {
  if (!db) throw new Error('Firestore is not initialized');
  const firestore = db;

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (projectId === 'tournament-tracker-prod') {
    throw new Error('Demo data generation is disabled in production environments.');
  }

  const tid = 'demo_bgmi_championship';
  const now = new Date().toISOString();

  interface DemoBatchOp {
    ref: ReturnType<typeof doc>;
    data: Record<string, unknown>;
  }

  const operations: DemoBatchOp[] = [];

  // 1. Create Demo Tournament doc (1 write)
  operations.push({
    ref: doc(firestore, 'tournaments', tid),
    data: {
      id: tid,
      name: 'Pro Esports Invitational (Demo)',
      gameId: 'BGMI',
      status: 'live',
      registrationOpen: true,
      rosterSize: 4,
      scoringSnapshot: {
        placementPoints: BGMI_PLACEMENT_POINTS,
        killPoints: 1,
        matchWinPoints: 1,
        mvpWeights: {
          kills: 2.5,
          damage: 0.01,
          assists: 1.0,
          survivalSeconds: 0.2 / 60,
          revives: 1.5,
        },
      },
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  // 2. Create 16 Public Teams (16 writes)
  DEMO_TEAMS.forEach((team, idx) => {
    const teamId = `demo_team_${idx + 1}`;
    operations.push({
      ref: doc(firestore, 'tournaments', tid, 'teams', teamId),
      data: {
        id: teamId,
        tournamentId: tid,
        teamName: team.name,
        players: team.players,
        createdAt: now,
      },
    });
  });

  // 3. Create 5 Matches with Full Results & Player Stats (5 writes)
  for (let m = 1; m <= 5; m++) {
    const mid = `demo_match_${m}`;

    // Deterministic shuffle of placements based on match number
    const shuffledTeams = [...DEMO_TEAMS].sort((a, b) => {
      const hashA = (a.name.charCodeAt(0) * m * 17) % 100;
      const hashB = (b.name.charCodeAt(0) * m * 17) % 100;
      return hashA - hashB;
    });

    const results = shuffledTeams.map((team, idx) => {
      const placement = idx + 1;
      const teamId = `demo_team_${DEMO_TEAMS.findIndex((t) => t.name === team.name) + 1}`;

      const baseKills = placement <= 3 ? 3 : placement <= 8 ? 1 : 0;
      const playerStats = team.players.map((pName, pIdx) => {
        const pKills = Math.max(0, baseKills + ((pIdx + m) % 3) - 1);
        const pDamage = pKills * 120 + ((pIdx * 45 + m * 30) % 200);
        const pAssists = (pIdx + m) % 3;
        const pSurvival = Math.max(120, 1800 - placement * 100 + pIdx * 10);
        const pRevives = (pIdx + m) % 2;

        return {
          playerId: `p_${teamId}_${pIdx}`,
          playerName: pName,
          kills: pKills,
          damage: pDamage,
          assists: pAssists,
          survivalSeconds: pSurvival,
          revives: pRevives,
        };
      });

      const teamKills = playerStats.reduce((sum, p) => sum + p.kills, 0);
      const placePts = BGMI_PLACEMENT_POINTS[placement] || 0;
      const totalPoints = placePts + teamKills * 1;

      return {
        teamId,
        teamName: team.name,
        placement,
        kills: teamKills,
        placementPoints: placePts,
        killPoints: teamKills,
        totalPoints,
        playerStats,
      };
    });

    operations.push({
      ref: doc(firestore, 'tournaments', tid, 'matches', mid),
      data: {
        id: mid,
        tournamentId: tid,
        matchNumber: m,
        scheduledAt: new Date(Date.now() - (5 - m) * 3600000).toISOString(),
        map: MAPS[m - 1],
        status: 'completed',
        results,
        isDemo: true,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  // Chunk operations into batches of at most 450 writes (respecting Firestore 500-write limit)
  const MAX_BATCH_SIZE = 450;
  const chunks: DemoBatchOp[][] = [];
  for (let i = 0; i < operations.length; i += MAX_BATCH_SIZE) {
    chunks.push(operations.slice(i, i + MAX_BATCH_SIZE));
  }

  let committedBatches = 0;
  for (let i = 0; i < chunks.length; i++) {
    const batch = writeBatch(firestore);
    for (const op of chunks[i]) {
      batch.set(op.ref, op.data, { merge: true });
    }

    try {
      await withTimeout(
        batch.commit(),
        15000,
        `generateDemoData:batch_${i + 1}_of_${chunks.length}`
      );
      committedBatches++;
    } catch (err: unknown) {
      if (committedBatches > 0) {
        const msg = `Batch ${i + 1} timed out or failed. Earlier committed batches (1 through ${committedBatches}) may have already succeeded on the server.`;
        console.warn(`[DemoData] ${msg}`);
        throw new Error(msg);
      }
      throw err;
    }
  }

  // 4. Populate publicAnalytics so leaderboards and graphs display immediately
  await withTimeout(syncTournamentAnalytics(tid), 10000, 'generateDemoData:syncAnalytics');

  return {
    success: true,
    tournamentId: tid,
    message: 'Demo tournament generated with 16 teams and 5 completed matches.',
  };
}

/**
 * Wipes demo or all tournament data using chunked writeBatches (max 450 writes per batch).
 * Avoids sequential individual delete roundtrips.
 */
export async function deleteAllData(
  confirmText: string,
  demoOnly = true
): Promise<DeleteDataResult> {
  if (!db) throw new Error('Firestore is not initialized');
  const firestore = db;

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!demoOnly && projectId === 'tournament-tracker-prod') {
    throw new Error('Full database wipe is disabled in production environments.');
  }

  if (!demoOnly && confirmText.trim() !== 'DELETE ALL DATA') {
    throw new Error('Confirmation phrase must match "DELETE ALL DATA" exactly.');
  }

  let deletedTournaments = 0;
  let deletedRegistrations = 0;
  let deletedSecrets = 0;
  let deletedContacts = 0;

  const refsToDelete: ReturnType<typeof doc>[] = [];

  if (demoOnly) {
    // 1. Delete tournaments where isDemo == true
    const tourneysQ = query(collection(firestore, 'tournaments'), where('isDemo', '==', true));
    const snap = await getDocs(tourneysQ);

    for (const tDoc of snap.docs) {
      const tid = tDoc.id;
      // Delete subcollections matches & teams
      const matchesSnap = await getDocs(collection(firestore, 'tournaments', tid, 'matches'));
      matchesSnap.docs.forEach((m) => refsToDelete.push(m.ref));

      const teamsSnap = await getDocs(collection(firestore, 'tournaments', tid, 'teams'));
      teamsSnap.docs.forEach((tm) => refsToDelete.push(tm.ref));

      refsToDelete.push(tDoc.ref);
      deletedTournaments++;
    }

    // Also check explicit demo tournament ID if not already caught
    try {
      const demoRef = doc(firestore, 'tournaments', 'demo_bgmi_championship');
      const matchesSnap = await getDocs(collection(firestore, 'tournaments', 'demo_bgmi_championship', 'matches'));
      matchesSnap.docs.forEach((m) => refsToDelete.push(m.ref));

      const teamsSnap = await getDocs(collection(firestore, 'tournaments', 'demo_bgmi_championship', 'teams'));
      teamsSnap.docs.forEach((tm) => refsToDelete.push(tm.ref));

      refsToDelete.push(demoRef);
    } catch {
      // Ignored
    }
  } else {
    // 2. Full wipe: tournaments, registrations, matchSecrets, contactMessages
    const tourneysSnap = await getDocs(collection(firestore, 'tournaments'));
    for (const tDoc of tourneysSnap.docs) {
      const tid = tDoc.id;
      const matchesSnap = await getDocs(collection(firestore, 'tournaments', tid, 'matches'));
      matchesSnap.docs.forEach((m) => refsToDelete.push(m.ref));

      const teamsSnap = await getDocs(collection(firestore, 'tournaments', tid, 'teams'));
      teamsSnap.docs.forEach((tm) => refsToDelete.push(tm.ref));

      refsToDelete.push(tDoc.ref);
      deletedTournaments++;
    }

    const regSnap = await getDocs(collection(firestore, 'registrations'));
    regSnap.docs.forEach((r) => {
      refsToDelete.push(r.ref);
      deletedRegistrations++;
    });

    const secSnap = await getDocs(collection(firestore, 'matchSecrets'));
    secSnap.docs.forEach((s) => {
      refsToDelete.push(s.ref);
      deletedSecrets++;
    });

    const conSnap = await getDocs(collection(firestore, 'contactMessages'));
    conSnap.docs.forEach((c) => {
      refsToDelete.push(c.ref);
      deletedContacts++;
    });
  }

  // Deduplicate refs
  const uniqueRefPaths = Array.from(new Set(refsToDelete.map((r) => r.path)));
  const uniqueRefs = uniqueRefPaths.map((p) => doc(firestore, p));

  // Chunk deletes into batches of max 450 writes
  const MAX_BATCH = 450;
  for (let i = 0; i < uniqueRefs.length; i += MAX_BATCH) {
    const chunk = uniqueRefs.slice(i, i + MAX_BATCH);
    const batch = writeBatch(firestore);
    chunk.forEach((r) => batch.delete(r));
    await withTimeout(batch.commit(), 15000, `deleteAllData:batch_${Math.floor(i / MAX_BATCH) + 1}`);
  }

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
}
