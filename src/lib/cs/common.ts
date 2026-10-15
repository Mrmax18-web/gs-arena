export const CS_MAPS: readonly string[] = [
  'Bermuda Remastered',
  'Purgatory',
  'Kalahari',
  'Alpine',
  'Nexterra',
  'Solara',
];

export const CS_DEFAULT_WIN_THRESHOLD = 4;
export const CS_DEFAULT_ROUNDS = 7;

export function computeWinner(
  teamAWins: number,
  teamBWins: number,
  threshold: number = CS_DEFAULT_WIN_THRESHOLD
): 'A' | 'B' | null {
  if (teamAWins >= threshold && teamAWins > teamBWins) {
    return 'A';
  }
  if (teamBWins >= threshold && teamBWins > teamAWins) {
    return 'B';
  }
  if (teamAWins + teamBWins >= CS_DEFAULT_ROUNDS) {
    if (teamAWins > teamBWins) return 'A';
    if (teamBWins > teamAWins) return 'B';
  }
  return null;
}
