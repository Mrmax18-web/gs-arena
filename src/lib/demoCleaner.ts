import { collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function deleteDemoData(): Promise<{
  deleted: {
    tournaments: number;
    teams: number;
    members: number;
    matches: number;
  };
}> {
  console.log('[Demo] Starting demo cleanup...');

  const counts = {
    tournaments: 0,
    teams: 0,
    members: 0,
    matches: 0,
  };

  // 1. Find all demo tournaments
  const tournamentsRef = collection(db, 'tournaments');
  const tournamentsQuery = query(tournamentsRef, where('isDemo', '==', true));
  const tournamentsSnap = await getDocs(tournamentsQuery);

  console.log(`[Demo] Found ${tournamentsSnap.docs.length} demo tournaments`);

  // 2. For each demo tournament, delete all nested data
  for (const tournDoc of tournamentsSnap.docs) {
    const tid = tournDoc.id;

    // Delete teams and team members
    const teamsRef = collection(db, 'tournaments', tid, 'teams');
    const teamsSnap = await getDocs(teamsRef);

    for (const teamDoc of teamsSnap.docs) {
      const teamId = teamDoc.id;

      // Delete members of this team
      const membersRef = collection(db, 'tournaments', tid, 'teams', teamId, 'members');
      const membersSnap = await getDocs(membersRef);

      for (const memberDoc of membersSnap.docs) {
        await deleteDoc(memberDoc.ref);
        counts.members++;
      }

      // Delete team
      await deleteDoc(teamDoc.ref);
      counts.teams++;
    }

    // Delete matches
    const matchesRef = collection(db, 'tournaments', tid, 'matches');
    const matchesSnap = await getDocs(matchesRef);

    for (const matchDoc of matchesSnap.docs) {
      await deleteDoc(matchDoc.ref);
      counts.matches++;
    }

    // Delete the tournament
    await deleteDoc(tournDoc.ref);
    counts.tournaments++;
  }

  // 3. Also delete demo registrations
  const regsRef = collection(db, 'registrations');
  const regsQuery = query(regsRef, where('isDemo', '==', true));
  const regsSnap = await getDocs(regsQuery);

  for (const regDoc of regsSnap.docs) {
    await deleteDoc(regDoc.ref);
  }

  console.log('[Demo] ✅ Cleanup complete:', counts);

  return { deleted: counts };
}
