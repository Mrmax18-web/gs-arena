import {
  createTournament,
  createTeam,
  createMember,
  createMatch,
} from './firestore';
import {
  DEMO_TEAMS_BGMI,
  DEMO_PLAYER_NAMES,
  DEMO_MAPS_BGMI,
} from './demoData';

export async function loadDemoData(adminEmail: string) {
  console.log('[Demo] Loading demo data for admin:', adminEmail);

  // 1. Create a demo tournament
  const tournamentId = await createTournament({
    game: 'BGMI',
    name: '🎯 DEMO — GS Arena Season 3',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    numMatches: 3,
    status: 'In Progress',
    mode: 'BR',
    isDemo: true,
  });

  console.log('[Demo] Tournament created:', tournamentId);

  // 2. Create 8 demo teams for BGMI
  const teamIds: string[] = [];

  for (let i = 0; i < DEMO_TEAMS_BGMI.length; i++) {
    const teamData = DEMO_TEAMS_BGMI[i];

    const teamId = await createTeam(tournamentId, {
      ...teamData,
      mode: 'BR',
      registeredAt: new Date().toISOString(),
      isDemo: true,
    });

    teamIds.push(teamId);

    // 3. Create 4 members per team
    for (let j = 0; j < 4; j++) {
      await createMember(tournamentId, teamId, {
        gameUid: `DEMO${i}${j}${Date.now()}`,
        displayName: DEMO_PLAYER_NAMES[(i * 4 + j) % DEMO_PLAYER_NAMES.length],
        ign: `DEMO_${teamData.teamTag}_${j + 1}`,
        email: `${teamData.teamTag.toLowerCase()}${j}@demo.com`,
        isCaptain: j === 0,
        isSubstitute: false,
        joinedAt: new Date().toISOString(),
        isDemo: true,
      });
    }

    console.log(`[Demo] Team ${teamData.teamName} created with 4 members`);
  }

  // 4. Create 3 demo matches with realistic results
  for (let round = 1; round <= 3; round++) {
    const mapName = DEMO_MAPS_BGMI[round - 1] || 'Erangel';

    // Pair teams randomly
    const shuffled = [...teamIds].sort(() => Math.random() - 0.5);

    for (let p = 0; p < shuffled.length; p += 2) {
      const teamA = shuffled[p];
      const teamB = shuffled[p + 1] || shuffled[0];

      const placementA = Math.floor(Math.random() * 8) + 1;
      const placementB = Math.floor(Math.random() * 8) + 1;
      const killsA = Math.floor(Math.random() * 15) + 5;
      const killsB = Math.floor(Math.random() * 15) + 5;

      await createMatch(tournamentId, {
        roundNumber: round,
        teamAId: teamA,
        teamBId: teamB,
        mapName,
        scheduledAt: new Date(Date.now() + round * 3600000).toISOString(),
        status: 'done',
        teamARoundWins: 0,
        teamBRoundWins: 0,
        teamAPlacement: placementA,
        teamBPlacement: placementB,
        teamAKills: killsA,
        teamBKills: killsB,
        winnerTeamId: placementA < placementB ? teamA : teamB,
        isDemo: true,
        notes: `Demo Match Round ${round} - ${mapName}`,
      });
    }

    console.log(`[Demo] Match round ${round} created`);
  }

  console.log('[Demo] ✅ Demo data loaded successfully');

  return {
    tournamentId,
    teamsCreated: DEMO_TEAMS_BGMI.length,
    matchesCreated: 3,
  };
}
