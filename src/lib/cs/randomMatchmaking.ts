function createPrng(seedStr: string): () => number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  let a = h >>> 0;
  return function (): number {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSeed(): string {
  const chars = '0123456789abcdef';
  let result = '';
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : null;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);
    for (let i = 0; i < 16; i++) {
      result += bytes[i].toString(16).padStart(2, '0');
    }
    return result;
  }
  for (let i = 0; i < 32; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

export function shuffleWithSeed<T>(arr: T[], seed: string): T[] {
  const result = [...arr];
  const rand = createPrng(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

export function generateBracket(
  teams: string[],
  seed: string
): {
  round1: Array<[string, string]>;
  semifinals: Array<[string, string]>;
  final: Array<[string, string]>;
} {
  const shuffled = shuffleWithSeed(teams, seed);
  const targetSize = shuffled.length <= 4 ? 4 : 8;
  const paddedTeams = [...shuffled];
  while (paddedTeams.length < targetSize) {
    paddedTeams.push('BYE');
  }

  if (targetSize === 4) {
    const round1: Array<[string, string]> = [
      [paddedTeams[0], paddedTeams[1]],
      [paddedTeams[2], paddedTeams[3]],
    ];
    return {
      round1,
      semifinals: [['Winner R1-M1', 'Winner R1-M2']],
      final: [['Winner Semi-1', 'Winner Semi-2']],
    };
  }

  const round1: Array<[string, string]> = [
    [paddedTeams[0], paddedTeams[1]],
    [paddedTeams[2], paddedTeams[3]],
    [paddedTeams[4], paddedTeams[5]],
    [paddedTeams[6], paddedTeams[7]],
  ];
  const semifinals: Array<[string, string]> = [
    ['Winner R1-M1', 'Winner R1-M2'],
    ['Winner R1-M3', 'Winner R1-M4'],
  ];
  const final: Array<[string, string]> = [
    ['Winner Semi-1', 'Winner Semi-2'],
  ];

  return {
    round1,
    semifinals,
    final,
  };
}
