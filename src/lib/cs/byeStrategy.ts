export type ByeStrategy = 'auto_advance' | 'rotate' | 'cross_group' | 'three_way';

export function autoAdvance(
  teamIds: string[]
): Array<{ teamA: string; teamB: string | null }> {
  const result: Array<{ teamA: string; teamB: string | null }> = [];
  const list = [...teamIds];
  for (let i = 0; i < list.length; i += 2) {
    if (i + 1 < list.length) {
      result.push({ teamA: list[i], teamB: list[i + 1] });
    } else {
      result.push({ teamA: list[i], teamB: null });
    }
  }
  return result;
}

export function rotateByes(
  teamIds: string[],
  roundNum: number
): Array<{ teamA: string; teamB: string | null }> {
  if (teamIds.length === 0) return [];
  if (teamIds.length % 2 === 0) {
    return autoAdvance(teamIds);
  }
  const byeIndex = (roundNum - 1) % teamIds.length;
  const byeTeam = teamIds[byeIndex];
  const activeTeams = teamIds.filter((_, idx) => idx !== byeIndex);
  const result: Array<{ teamA: string; teamB: string | null }> = [];
  for (let i = 0; i < activeTeams.length; i += 2) {
    result.push({ teamA: activeTeams[i], teamB: activeTeams[i + 1] });
  }
  result.push({ teamA: byeTeam, teamB: null });
  return result;
}

export function crossGroup(
  groupA: string[],
  groupB: string[]
): Array<{ teamA: string; teamB: string }> {
  const paired: Array<{ teamA: string; teamB: string }> = [];
  if (groupA.length % 2 !== 0 && groupB.length % 2 !== 0) {
    const surplusA = groupA[groupA.length - 1];
    const surplusB = groupB[groupB.length - 1];
    paired.push({ teamA: surplusA, teamB: surplusB });
  }
  return paired;
}

export function threeWay(
  teamIds: string[]
): Array<{ teams: [string, string, string] }> {
  if (teamIds.length < 3) return [];
  const triplets: Array<{ teams: [string, string, string] }> = [];
  for (let i = 0; i <= teamIds.length - 3; i += 3) {
    triplets.push({
      teams: [teamIds[i], teamIds[i + 1], teamIds[i + 2]],
    });
  }
  return triplets;
}
