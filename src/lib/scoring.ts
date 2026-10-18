import { Match, ScoringSnapshot, TournamentStandingsRow } from '../types/tournament';
import { GameId } from '../types/game';

/**
 * Calculate placement points from a scoring snapshot for a given placement rank.
 */
export function getPlacementPoints(placement: number, snapshot: ScoringSnapshot): number {
  if (placement < 1) return 0;
  const table = snapshot?.placementPoints ?? [];
  return table[placement] ?? 0;
}

/**
 * Calculates match points for a single team's result in Battle Royale.
 * teamMatchPoints = placementPoints[placement] + teamKills * killPoints
 */
export function calculateBRMatchPoints(
  placement: number,
  teamKills: number,
  snapshot: ScoringSnapshot
): { placementPoints: number; killPoints: number; totalPoints: number } {
  const placementPts = getPlacementPoints(placement, snapshot);
  const killPtsMultiplier = snapshot?.killPoints ?? 1;
  const killPts = (teamKills ?? 0) * killPtsMultiplier;
  const totalPoints = placementPts + killPts;
  return {
    placementPoints: placementPts,
    killPoints: killPts,
    totalPoints,
  };
}

/**
 * Computes Battle Royale tournament standings from raw matches.
 * Idempotent: Standings are recomputed from raw match results every time.
 * Tie-breaker order:
 * 1. Total Points (descending)
 * 2. Total Placement Points (descending)
 * 3. Total Kills (descending)
 * 4. Number of 1st-place finishes / WWCD (descending)
 * 5. Best placement in latest match (ascending, 1 is best)
 * 6. Team name (alphabetical, ascending)
 */
export function computeTournamentStandingsBR(
  matches: Match[],
  snapshot: ScoringSnapshot
): TournamentStandingsRow[] {
  const teamMap = new Map<string, {
    teamId: string;
    teamName: string;
    matchesPlayed: number;
    placementPoints: number;
    killPoints: number;
    totalKills: number;
    totalPoints: number;
    wwcdCount: number;
    latestMatchNumber: number;
    bestPlacementInLatestMatch: number;
  }>();

  // Sort matches by matchNumber ascending to accurately track latest match placement
  const sortedMatches = [...(matches || [])].sort((a, b) => (a?.matchNumber ?? 0) - (b?.matchNumber ?? 0));

  for (const match of sortedMatches) {
    if (!match?.results || match.status !== 'completed') {
      continue;
    }

    for (const result of (match.results || [])) {
      if (!result?.teamId) continue;

      const teamId = result.teamId;
      const teamName = result.teamName || 'Unknown Team';
      const placement = result.placement ?? 999;
      
      // Calculate kills from playerStats if present or fallback to result.kills
      const derivedKills = Array.isArray(result.playerStats) && result.playerStats.length > 0
        ? result.playerStats.reduce((sum, p) => sum + (p?.kills ?? 0), 0)
        : (result.kills ?? 0);

      const pts = calculateBRMatchPoints(placement, derivedKills, snapshot);

      const existing = teamMap.get(teamId) ?? {
        teamId,
        teamName,
        matchesPlayed: 0,
        placementPoints: 0,
        killPoints: 0,
        totalKills: 0,
        totalPoints: 0,
        wwcdCount: 0,
        latestMatchNumber: -1,
        bestPlacementInLatestMatch: 999,
      };

      existing.matchesPlayed += 1;
      existing.placementPoints += pts.placementPoints;
      existing.killPoints += pts.killPoints;
      existing.totalKills += derivedKills;
      existing.totalPoints += pts.totalPoints;
      if (placement === 1) {
        existing.wwcdCount += 1;
      }

      // Track latest match placement for tie-breaking
      const currentMatchNum = match.matchNumber ?? 0;
      if (currentMatchNum >= existing.latestMatchNumber) {
        existing.latestMatchNumber = currentMatchNum;
        existing.bestPlacementInLatestMatch = placement;
      }

      teamMap.set(teamId, existing);
    }
  }

  const rows = Array.from(teamMap.values());

  // Sort with BR tie-breakers
  rows.sort((a, b) => {
    // 1. Total points
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    // 2. Total placement points
    if (b.placementPoints !== a.placementPoints) {
      return b.placementPoints - a.placementPoints;
    }
    // 3. Total kills
    if (b.totalKills !== a.totalKills) {
      return b.totalKills - a.totalKills;
    }
    // 4. Number of 1st-place finishes (WWCD)
    if (b.wwcdCount !== a.wwcdCount) {
      return b.wwcdCount - a.wwcdCount;
    }
    // 5. Best placement in latest match (lower number is better, e.g. 1st > 2nd)
    if (a.bestPlacementInLatestMatch !== b.bestPlacementInLatestMatch) {
      return a.bestPlacementInLatestMatch - b.bestPlacementInLatestMatch;
    }
    // 6. Alphabetical (stable)
    return a.teamName.localeCompare(b.teamName);
  });

  return rows.map((item, index) => ({
    rank: index + 1,
    teamId: item.teamId,
    teamName: item.teamName,
    matchesPlayed: item.matchesPlayed,
    placementPoints: item.placementPoints,
    killPoints: item.killPoints,
    totalKills: item.totalKills,
    totalPoints: item.totalPoints,
    wwcdCount: item.wwcdCount,
    bestPlacement: item.bestPlacementInLatestMatch !== 999 ? item.bestPlacementInLatestMatch : undefined,
    isLeader: index === 0 && item.matchesPlayed > 0,
  }));
}

/**
 * Computes Clash Squad standings from raw match results.
 * Tie-breakers:
 * 1. Match wins (descending)
 * 2. Round difference (roundsWon - roundsLost) (descending)
 * 3. Rounds won (descending)
 * 4. Alphabetical (stable)
 */
export function computeTournamentStandingsCS(
  matches: Match[],
  snapshot: ScoringSnapshot
): TournamentStandingsRow[] {
  const matchWinPoints = snapshot?.matchWinPoints ?? 1;

  const teamMap = new Map<string, {
    teamId: string;
    teamName: string;
    matchesPlayed: number;
    matchWins: number;
    roundsWon: number;
    roundsLost: number;
    totalKills: number;
  }>();

  for (const match of (matches || [])) {
    if (!match?.results || match.status !== 'completed') {
      continue;
    }

    for (const result of (match.results || [])) {
      if (!result?.teamId) continue;

      const teamId = result.teamId;
      const teamName = result.teamName || 'Unknown Team';
      const roundsWon = result.roundsWon ?? 0;
      const roundsLost = result.roundsLost ?? 0;
      const isWinner = result.placement === 1 || roundsWon > roundsLost;

      const derivedKills = Array.isArray(result.playerStats) && result.playerStats.length > 0
        ? result.playerStats.reduce((sum, p) => sum + (p?.kills ?? 0), 0)
        : (result.kills ?? 0);

      const existing = teamMap.get(teamId) ?? {
        teamId,
        teamName,
        matchesPlayed: 0,
        matchWins: 0,
        roundsWon: 0,
        roundsLost: 0,
        totalKills: 0,
      };

      existing.matchesPlayed += 1;
      if (isWinner) {
        existing.matchWins += 1;
      }
      existing.roundsWon += roundsWon;
      existing.roundsLost += roundsLost;
      existing.totalKills += derivedKills;

      teamMap.set(teamId, existing);
    }
  }

  const rows = Array.from(teamMap.values());

  rows.sort((a, b) => {
    // 1. Match wins
    if (b.matchWins !== a.matchWins) {
      return b.matchWins - a.matchWins;
    }
    // 2. Round difference
    const diffA = a.roundsWon - a.roundsLost;
    const diffB = b.roundsWon - b.roundsLost;
    if (diffB !== diffA) {
      return diffB - diffA;
    }
    // 3. Rounds won
    if (b.roundsWon !== a.roundsWon) {
      return b.roundsWon - a.roundsWon;
    }
    // 4. Alphabetical
    return a.teamName.localeCompare(b.teamName);
  });

  return rows.map((item, index) => {
    const roundDiff = item.roundsWon - item.roundsLost;
    const totalPoints = item.matchWins * matchWinPoints;

    return {
      rank: index + 1,
      teamId: item.teamId,
      teamName: item.teamName,
      matchesPlayed: item.matchesPlayed,
      placementPoints: 0,
      killPoints: 0,
      totalKills: item.totalKills,
      totalPoints,
      wwcdCount: 0,
      matchWins: item.matchWins,
      roundsWon: item.roundsWon,
      roundsLost: item.roundsLost,
      roundDifference: roundDiff,
      isLeader: index === 0 && item.matchesPlayed > 0,
    };
  });
}

/**
 * Universal standings calculator supporting both BR and CS based on gameId.
 */
export function computeStandings(
  gameId: GameId,
  matches: Match[],
  snapshot: ScoringSnapshot
): TournamentStandingsRow[] {
  if (gameId === 'FF_CS') {
    return computeTournamentStandingsCS(matches, snapshot);
  }
  return computeTournamentStandingsBR(matches, snapshot);
}
