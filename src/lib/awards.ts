import { AwardWinner, Match, PlayerStats } from '../types/tournament';
import { MvpWeights } from '../types/game';
import { DEFAULT_MVP_WEIGHTS } from './constants';

/**
 * Calculates player impact score for MVP.
 * Formula: kills * 2.5 + damage / 100 + assists * 1.0 + (survivalSeconds / 60) * 0.2 + revives * 1.5
 * Uses custom weights if provided in snapshot/config.
 */
export function calculateMvpImpact(
  stats: Partial<PlayerStats> | null | undefined,
  weights: MvpWeights = DEFAULT_MVP_WEIGHTS
): number {
  if (!stats) return 0;
  const kills = stats.kills ?? 0;
  const damage = stats.damage ?? 0;
  const assists = stats.assists ?? 0;
  const survivalSeconds = stats.survivalSeconds ?? 0;
  const revives = stats.revives ?? 0;

  // Use weights with safe fallbacks
  const wKills = weights?.kills ?? 2.5;
  const wDamage = weights?.damage ?? 0.01;
  const wAssists = weights?.assists ?? 1.0;
  const wSurvival = weights?.survivalSeconds ?? (0.2 / 60);
  const wRevives = weights?.revives ?? 1.5;

  const score =
    kills * wKills +
    damage * wDamage +
    assists * wAssists +
    survivalSeconds * wSurvival +
    revives * wRevives;

  return Math.round(score * 100) / 100;
}

interface AggregatePlayerStats {
  playerId: string;
  playerName: string;
  teamName: string;
  totalKills: number;
  totalDamage: number;
  totalAssists: number;
  totalSurvivalSeconds: number;
  totalRevives: number;
  matchesPlayed: number;
}

/**
 * Aggregates player stats across completed matches.
 */
function aggregatePlayerStats(matches: Match[]): AggregatePlayerStats[] {
  const map = new Map<string, AggregatePlayerStats>();

  for (const match of (matches || [])) {
    if (match.status !== 'completed' || !match.results) continue;

    for (const teamResult of (match.results || [])) {
      const teamName = teamResult.teamName || 'Unknown Team';
      const players = teamResult.playerStats || [];

      for (const p of players) {
        if (!p || !p.playerName) continue;
        const key = p.playerId || p.playerName;
        const existing = map.get(key) ?? {
          playerId: key,
          playerName: p.playerName,
          teamName,
          totalKills: 0,
          totalDamage: 0,
          totalAssists: 0,
          totalSurvivalSeconds: 0,
          totalRevives: 0,
          matchesPlayed: 0,
        };

        existing.totalKills += p.kills ?? 0;
        existing.totalDamage += p.damage ?? 0;
        existing.totalAssists += p.assists ?? 0;
        existing.totalSurvivalSeconds += p.survivalSeconds ?? 0;
        existing.totalRevives += p.revives ?? 0;
        existing.matchesPlayed += 1;

        map.set(key, existing);
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Determines the MVP for a single match.
 * Returns null if no player stats are recorded.
 */
export function findMatchMvp(
  match: Match,
  weights: MvpWeights = DEFAULT_MVP_WEIGHTS
): AwardWinner | null {
  if (!match?.results || match.results.length === 0) return null;

  let bestPlayer: AwardWinner | null = null;
  let highestScore = -1;

  for (const teamResult of match.results) {
    const teamName = teamResult.teamName || 'Unknown Team';
    const players = teamResult.playerStats || [];

    for (const p of players) {
      if (!p || !p.playerName) continue;
      const score = calculateMvpImpact(p, weights);

      if (score > highestScore) {
        highestScore = score;
        bestPlayer = {
          playerId: p.playerId || p.playerName,
          playerName: p.playerName,
          teamName,
          score,
          kills: p.kills ?? 0,
          scope: `Match ${match.matchNumber}`,
        };
      }
    }
  }

  return highestScore >= 0 ? bestPlayer : null;
}

/**
 * Determines the MVP for an entire tournament.
 * Returns null if no player stats are available.
 */
export function findTournamentMvp(
  matches: Match[],
  weights: MvpWeights = DEFAULT_MVP_WEIGHTS,
  scopeLabel = 'Tournament'
): AwardWinner | null {
  const aggregated = aggregatePlayerStats(matches);
  if (aggregated.length === 0) return null;

  let bestPlayer: AwardWinner | null = null;
  let highestScore = -1;

  for (const p of aggregated) {
    const stats: PlayerStats = {
      playerId: p.playerId,
      playerName: p.playerName,
      kills: p.totalKills,
      damage: p.totalDamage,
      assists: p.totalAssists,
      survivalSeconds: p.totalSurvivalSeconds,
      revives: p.totalRevives,
    };
    const score = calculateMvpImpact(stats, weights);

    if (score > highestScore) {
      highestScore = score;
      bestPlayer = {
        playerId: p.playerId,
        playerName: p.playerName,
        teamName: p.teamName,
        score,
        kills: p.totalKills,
        scope: scopeLabel,
      };
    } else if (score === highestScore && bestPlayer) {
      // Deterministic tie-breaking: kills desc, score desc, playerId asc
      if (p.totalKills > (bestPlayer.kills ?? 0)) {
        bestPlayer = {
          playerId: p.playerId,
          playerName: p.playerName,
          teamName: p.teamName,
          score,
          kills: p.totalKills,
          scope: scopeLabel,
        };
      } else if (p.totalKills === (bestPlayer.kills ?? 0)) {
        if (p.playerId.localeCompare(bestPlayer.playerId) < 0) {
          bestPlayer = {
            playerId: p.playerId,
            playerName: p.playerName,
            teamName: p.teamName,
            score,
            kills: p.totalKills,
            scope: scopeLabel,
          };
        }
      }
    }
  }

  return highestScore >= 0 ? bestPlayer : null;
}

/**
 * Returns deterministic ranked list of MVP candidates sorted by:
 * 1. score/points desc
 * 2. kills desc
 * 3. playerId asc
 */
export function getRankedMvpCandidates(
  matches: Match[],
  weights: MvpWeights = DEFAULT_MVP_WEIGHTS,
  scopeLabel = 'Tournament'
): AwardWinner[] {
  const aggregated = aggregatePlayerStats(matches);
  const candidates: AwardWinner[] = aggregated.map((p) => {
    const stats: PlayerStats = {
      playerId: p.playerId,
      playerName: p.playerName,
      kills: p.totalKills,
      damage: p.totalDamage,
      assists: p.totalAssists,
      survivalSeconds: p.totalSurvivalSeconds,
      revives: p.totalRevives,
    };
    return {
      playerId: p.playerId,
      playerName: p.playerName,
      teamName: p.teamName,
      score: calculateMvpImpact(stats, weights),
      kills: p.totalKills,
      scope: scopeLabel,
    };
  });

  candidates.sort((a, b) => {
    // 1. Score / Points descending
    if (b.score !== a.score) return b.score - a.score;
    // 2. Kills descending
    const killsA = a.kills ?? 0;
    const killsB = b.kills ?? 0;
    if (killsB !== killsA) return killsB - killsA;
    // 3. Player ID ascending
    return a.playerId.localeCompare(b.playerId);
  });

  return candidates;
}

/**
 * Finds the Top Fragger for a single match.
 * Ties are broken by fewer matches (1 in single match) then alphabetical.
 */
export function findMatchTopFragger(match: Match): AwardWinner | null {
  if (!match?.results || match.results.length === 0) return null;

  const candidates: { player: PlayerStats; teamName: string }[] = [];

  for (const teamResult of match.results) {
    const teamName = teamResult.teamName || 'Unknown Team';
    for (const p of (teamResult.playerStats || [])) {
      if (p && p.playerName) {
        candidates.push({ player: p, teamName });
      }
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const killsA = a.player.kills ?? 0;
    const killsB = b.player.kills ?? 0;
    if (killsB !== killsA) {
      return killsB - killsA;
    }
    return a.player.playerName.localeCompare(b.player.playerName);
  });

  const winner = candidates[0];
  const maxKills = winner.player.kills ?? 0;

  return {
    playerId: winner.player.playerId || winner.player.playerName,
    playerName: winner.player.playerName,
    teamName: winner.teamName,
    score: maxKills,
    kills: maxKills,
    scope: `Match ${match.matchNumber}`,
  };
}

/**
 * Finds the Top Fragger across a tournament.
 * Ties are broken by fewer matches played, then name.
 */
export function findTournamentTopFragger(
  matches: Match[],
  scopeLabel = 'Tournament'
): AwardWinner | null {
  const aggregated = aggregatePlayerStats(matches);
  if (aggregated.length === 0) return null;

  aggregated.sort((a, b) => {
    // 1. Total kills descending
    if (b.totalKills !== a.totalKills) {
      return b.totalKills - a.totalKills;
    }
    // 2. Fewer matches played ascending
    if (a.matchesPlayed !== b.matchesPlayed) {
      return a.matchesPlayed - b.matchesPlayed;
    }
    // 3. Name alphabetical ascending
    return a.playerName.localeCompare(b.playerName);
  });

  const winner = aggregated[0];
  return {
    playerId: winner.playerId,
    playerName: winner.playerName,
    teamName: winner.teamName,
    score: winner.totalKills,
    kills: winner.totalKills,
    scope: scopeLabel,
  };
}
