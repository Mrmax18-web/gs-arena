import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../shared/firebaseAdmin.js';

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

export const generateDemoData = onCall(async (request) => {
  // 1. Verify caller has creator role
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }

  const callerRole = request.auth.token?.role;
  if (callerRole !== 'creator') {
    throw new HttpsError(
      'permission-denied',
      'Only the Platform Creator may invoke generateDemoData.'
    );
  }

  const batch = db.batch();
  const tid = 'demo_bgmi_championship';
  const now = new Date().toISOString();

  // 1. Create or overwrite Demo Tournament
  const tourneyRef = db.collection('tournaments').doc(tid);
  batch.set(
    tourneyRef,
    {
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
    { merge: true }
  );

  // 2. Create 16 Public Teams
  const createdTeamIds: string[] = [];
  DEMO_TEAMS.forEach((team, idx) => {
    const teamId = `demo_team_${idx + 1}`;
    createdTeamIds.push(teamId);
    const teamRef = tourneyRef.collection('teams').doc(teamId);
    batch.set(
      teamRef,
      {
        tournamentId: tid,
        teamName: team.name,
        players: team.players,
        createdAt: now,
      },
      { merge: true }
    );
  });

  // 3. Create 5 Matches with Full Results & Player Stats
  for (let m = 1; m <= 5; m++) {
    const mid = `demo_match_${m}`;
    const matchRef = tourneyRef.collection('matches').doc(mid);

    // Deterministic shuffle of placements based on match number
    const shuffledTeams = [...DEMO_TEAMS].sort((a, b) => {
      const hashA = (a.name.charCodeAt(0) * m * 17) % 100;
      const hashB = (b.name.charCodeAt(0) * m * 17) % 100;
      return hashA - hashB;
    });

    const results = shuffledTeams.map((team, idx) => {
      const placement = idx + 1;
      const teamId = `demo_team_${DEMO_TEAMS.findIndex((t) => t.name === team.name) + 1}`;

      // Generate realistic player stats
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

    batch.set(
      matchRef,
      {
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
      { merge: true }
    );
  }

  await batch.commit();

  return {
    success: true,
    tournamentId: tid,
    message: 'Demo tournament generated with 16 teams and 5 completed matches.',
  };
});
