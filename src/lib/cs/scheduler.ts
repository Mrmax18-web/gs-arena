import type { Team, Match } from '../../types';
import { CS_MAPS } from './common';
import { shuffleWithSeed } from './randomMatchmaking';

export function generateSchedule(
  tournamentId: string,
  teams: Team[],
  groups: Record<string, string[]>,
  seed: string,
  startDate: Date
): Omit<Match, 'id'>[] {
  const matches: Omit<Match, 'id'>[] = [];
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  let currentTime = new Date(startDate.getTime());
  let globalRound = 1;

  const groupKeys = Object.keys(groups).sort();
  for (const groupLabel of groupKeys) {
    const rawTeamIds = groups[groupLabel] || [];
    const validTeamIds = rawTeamIds.filter((id) => teamMap.has(id));
    if (validTeamIds.length < 2) continue;

    const shuffledTeamIds = shuffleWithSeed(validTeamIds, `${seed}_${groupLabel}`);
    const hasBye = shuffledTeamIds.length % 2 !== 0;
    const workingList = [...shuffledTeamIds];
    if (hasBye) {
      workingList.push('__BYE__');
    }

    const n = workingList.length;
    const totalRounds = n - 1;
    const half = n / 2;

    for (let round = 0; round < totalRounds; round++) {
      for (let i = 0; i < half; i++) {
        const teamAId = workingList[i];
        const teamBId = workingList[n - 1 - i];

        if (teamAId === '__BYE__' || teamBId === '__BYE__') {
          continue;
        }

        const mapIndex = (matches.length + round) % CS_MAPS.length;
        const mapName = CS_MAPS[mapIndex];

        matches.push({
          groupLabel,
          roundNumber: globalRound,
          teamAId,
          teamBId,
          mapName,
          scheduledAt: currentTime.toISOString(),
          status: 'scheduled',
          teamARoundWins: 0,
          teamBRoundWins: 0,
          notes: `${groupLabel} - Match Day Round ${round + 1}`,
        });

        currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
      }
      globalRound++;
    }
  }

  return matches;
}
