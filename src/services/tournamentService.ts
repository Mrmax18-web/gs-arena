import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  tournamentConverter,
  matchConverter,
  teamConverter,
} from '../lib/converters';
import {
  Match,
  MatchSecret,
  ScoringSnapshot,
  Team,
  TeamMatchResult,
  Tournament,
} from '../types/tournament';
import { GameId } from '../types/game';
import { CANONICAL_GAMES } from '../lib/constants';

export async function createTournament(
  name: string,
  gameId: GameId,
  rosterSize = 4,
  customSnapshot?: Partial<ScoringSnapshot>,
  extra?: { entryFeePaise?: number; upiQrUrl?: string; upiId?: string }
): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');

  const defaultGame = CANONICAL_GAMES[gameId] || CANONICAL_GAMES.BGMI;
  const snapshot: ScoringSnapshot = {
    placementPoints: customSnapshot?.placementPoints ?? defaultGame.placementPoints,
    killPoints: customSnapshot?.killPoints ?? defaultGame.killPoints,
    matchWinPoints: customSnapshot?.matchWinPoints ?? defaultGame.matchWinPoints ?? 1,
    mvpWeights: customSnapshot?.mvpWeights ?? defaultGame.mvpWeights,
  };

  const colRef = collection(db, 'tournaments').withConverter(tournamentConverter);
  const newDoc = doc(colRef);

  const tournament: Tournament = {
    id: newDoc.id,
    name,
    gameId,
    status: 'upcoming',
    registrationOpen: true,
    rosterSize,
    scoringSnapshot: snapshot,
    entryFeePaise: extra?.entryFeePaise ?? 0,
    upiQrUrl: extra?.upiQrUrl,
    upiId: extra?.upiId,
    isDemo: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(newDoc, tournament);
  return newDoc.id;
}


export async function updateTournament(
  tid: string,
  data: Partial<Tournament>
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const docRef = doc(db, 'tournaments', tid);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteTournament(tid: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  await deleteDoc(doc(db, 'tournaments', tid));
}

export async function createMatch(
  tid: string,
  matchData: Omit<Match, 'id' | 'tournamentId' | 'results' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');

  // Verify duplicate match number
  const matchesRef = collection(db, 'tournaments', tid, 'matches').withConverter(matchConverter);
  const existingQ = query(matchesRef, where('matchNumber', '==', matchData.matchNumber));
  const snap = await getDocs(existingQ);
  if (!snap.empty) {
    throw new Error(`Match Number #${matchData.matchNumber} already exists in this tournament.`);
  }

  const newDoc = doc(matchesRef);
  const match: Match = {
    id: newDoc.id,
    tournamentId: tid,
    matchNumber: matchData.matchNumber,
    scheduledAt: matchData.scheduledAt,
    map: matchData.map,
    status: matchData.status || 'scheduled',
    results: [],
    isDemo: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(newDoc, match);
  return newDoc.id;
}

export async function updateMatch(
  tid: string,
  mid: string,
  data: Partial<Match>
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const matchRef = doc(db, 'tournaments', tid, 'matches', mid);
  await updateDoc(matchRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteMatch(tid: string, mid: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  await deleteDoc(doc(db, 'tournaments', tid, 'matches', mid));
}

/**
 * Publishes match results safely using a transaction.
 */
export async function saveMatchResults(
  tid: string,
  mid: string,
  results: TeamMatchResult[]
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  const matchRef = doc(db, 'tournaments', tid, 'matches', mid).withConverter(matchConverter);

  await runTransaction(db, async (txn) => {
    const snap = await txn.get(matchRef);
    if (!snap.exists()) {
      throw new Error('Target match does not exist.');
    }

    txn.update(matchRef, {
      results,
      status: 'completed',
      updatedAt: new Date().toISOString(),
    });
  });

  // Automatically update the public analytics document with sanitized data
  await syncTournamentAnalytics(tid);
}

/**
 * Match secrets (Room ID & Password) - stored in private collection /matchSecrets/{mid}
 */
export async function saveMatchSecrets(
  mid: string,
  roomId: string,
  roomPassword: string
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  const secretRef = doc(db, 'matchSecrets', mid);
  await setDoc(
    secretRef,
    {
      id: mid,
      roomId,
      roomPassword,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function getMatchSecrets(mid: string): Promise<MatchSecret | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'matchSecrets', mid));
    if (snap.exists()) {
      return snap.data() as MatchSecret;
    }
  } catch (e) {
    console.warn('Cannot read match secrets (admin credentials required):', e);
  }
  return null;
}

export async function getTournamentTeams(tid: string): Promise<Team[]> {
  if (!db) return [];
  const colRef = collection(db, 'tournaments', tid, 'teams').withConverter(teamConverter);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => d.data());
}

/**
 * Aggregates sanitized public analytics (per-team kills and per-player kills)
 * with ZERO PII and stores in publicAnalytics/{tid}
 */
export async function syncTournamentAnalytics(tid: string): Promise<void> {
  if (!db) return;
  try {
    const tDoc = await getDoc(doc(db, 'tournaments', tid).withConverter(tournamentConverter));
    if (!tDoc.exists()) return;
    const tourney = tDoc.data();

    const matchesRef = collection(db, 'tournaments', tid, 'matches').withConverter(matchConverter);
    const snap = await getDocs(query(matchesRef, where('status', '==', 'completed')));
    const matches = snap.docs.map((d) => d.data());

    const teamMap = new Map<string, { teamId: string; teamName: string; totalKills: number; matchesPlayed: number }>();
    const playerMap = new Map<string, { playerId: string; playerName: string; teamName: string; kills: number; damage: number; matchesPlayed: number }>();

    for (const match of matches) {
      for (const res of (match.results || [])) {
        if (!res?.teamId) continue;
        const derivedKills = Array.isArray(res.playerStats) && res.playerStats.length > 0
          ? res.playerStats.reduce((sum, p) => sum + (p?.kills ?? 0), 0)
          : (res.kills ?? 0);

        const existingTeam = teamMap.get(res.teamId) ?? {
          teamId: res.teamId,
          teamName: res.teamName || 'Unknown Team',
          totalKills: 0,
          matchesPlayed: 0,
        };
        existingTeam.totalKills += derivedKills;
        existingTeam.matchesPlayed += 1;
        teamMap.set(res.teamId, existingTeam);

        for (const p of (res.playerStats || [])) {
          if (!p || !p.playerName) continue;
          const key = p.playerId || p.playerName;
          const existingPlayer = playerMap.get(key) ?? {
            playerId: key,
            playerName: p.playerName,
            teamName: res.teamName || 'Unknown Team',
            kills: 0,
            damage: 0,
            matchesPlayed: 0,
          };
          existingPlayer.kills += (p.kills ?? 0);
          existingPlayer.damage += (p.damage ?? 0);
          existingPlayer.matchesPlayed += 1;
          playerMap.set(key, existingPlayer);
        }
      }
    }

    const teamKills = Array.from(teamMap.values()).sort((a, b) => b.totalKills - a.totalKills);
    const playerKills = Array.from(playerMap.values()).sort((a, b) => b.kills - a.kills);

    await setDoc(doc(db, 'publicAnalytics', tid), {
      tournamentId: tid,
      tournamentName: tourney.name,
      gameId: tourney.gameId,
      teamKills,
      playerKills,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to sync public analytics doc:', err);
  }
}

export async function getTournamentAnalytics(tid: string) {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'publicAnalytics', tid));
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.warn('Error reading publicAnalytics doc:', err);
  }
  return null;
}
