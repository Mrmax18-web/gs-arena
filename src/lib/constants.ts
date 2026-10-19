import { GameConfig, GameId, MvpWeights } from '../types/game';
import { BackgroundConfig, SystemConfig } from '../types/config';

export const GAME_STORAGE_KEY = 'ttp_active_game_id';
export const THEME_STORAGE_KEY = 'ttp_theme_mode';
export const SIDEBAR_STORAGE_KEY = 'ttp_sidebar_collapsed';

export const DEFAULT_MVP_WEIGHTS: MvpWeights = {
  kills: 2.5,
  damage: 0.01, // damage / 100
  assists: 1.0,
  survivalSeconds: 0.2 / 60, // (survivalSeconds / 60) * 0.2
  revives: 1.5,
};

export const DEFAULT_BGMI_CONFIG: GameConfig = {
  id: 'BGMI',
  name: 'Battlegrounds Mobile India',
  mode: 'Battle Royale',
  // Index 0 unused; 1st = 10, 2nd = 6, 3rd = 5, 4th = 4, 5th = 3, 6th = 2, 7th = 1, 8th = 1, 9th+ = 0
  placementPoints: [0, 10, 6, 5, 4, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  killPoints: 1,
  mvpWeights: { ...DEFAULT_MVP_WEIGHTS },
  rules: 'Official BGIS / Battle Royale scoring. Placement points + 1 point per kill. Matches: 16 teams per lobby.',
};

export const DEFAULT_FF_BR_CONFIG: GameConfig = {
  id: 'FF_BR',
  name: 'Free Fire - Battle Royale',
  mode: 'Battle Royale',
  // Index 0 unused; 1st = 12, 2nd = 9, 3rd = 8, 4th = 7, 5th = 6, 6th = 5, 7th = 4, 8th = 3, 9th = 2, 10th = 1, 11th+ = 0
  placementPoints: [0, 12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0],
  killPoints: 1,
  mvpWeights: { ...DEFAULT_MVP_WEIGHTS },
  rules: 'Free Fire Esports Official BR scoring. Placement points down to 10th place + 1 point per kill.',
};

export const DEFAULT_FF_CS_CONFIG: GameConfig = {
  id: 'FF_CS',
  name: 'Free Fire - Clash Squad',
  mode: 'Clash Squad',
  placementPoints: [],
  killPoints: 0,
  matchWinPoints: 1,
  mvpWeights: { ...DEFAULT_MVP_WEIGHTS },
  rules: '4v4 Clash Squad. Match wins determine ranking, followed by Round Difference and Rounds Won.',
};

export const CANONICAL_GAMES: Record<GameId, GameConfig> = {
  BGMI: DEFAULT_BGMI_CONFIG,
  FF_BR: DEFAULT_FF_BR_CONFIG,
  FF_CS: DEFAULT_FF_CS_CONFIG,
};

export const DEFAULT_BACKGROUND_CONFIG: BackgroundConfig = {
  enabled: true,
  background: '#000000',
  baseColor: '#DE0202',
  accentColor: '#D10000',
  speed: 11,
  scale: 96,
  hover: 98,
  colorSplit: 22,
  ribbonGrain: 0.1,
  colors: ['#DE0202', '#D10000'],
  opacity: 1.0,
  advanced: {
    goldColor: '#FF0000',
    highColor: '#CF2A2A',
    blueDeep: '#E42222',
    blueHigh: '#A50B0B',
    paleColor: '#F8F4EA',
    coolTint: '#DCE6F5',
  },
};

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  siteName: 'GS Arena',
  logos: {
    dark: '/favicon.svg',
    light: '/favicon.svg',
    mark: '/favicon.svg',
  },
  appearance: {
    bgmiIconUrl: '',
    ffIconUrl: '',
    arenaLogoUrl: '',
  },
  viewerBaseUrl: typeof window !== 'undefined' ? window.location.origin : '',
  faqItems: [
    {
      id: 'faq-1',
      question: 'How are Battle Royale tournament points calculated?',
      answer:
        'Battle Royale points are calculated as Team Match Points = Placement Points + (Team Kills × Kill Points). In BGMI, 1st place awards 10 points; in Free Fire BR, 1st place awards 12 points. Each kill awards 1 point.',
    },
    {
      id: 'faq-2',
      question: 'How are ties broken on the Leaderboard?',
      answer:
        'In Battle Royale, ties are broken in order: 1) Total Points, 2) Placement Points, 3) Total Kills, 4) Number of 1st-place finishes (WWCD), 5) Best placement in latest match, 6) Alphabetical order. In Clash Squad: 1) Match Wins, 2) Round Difference, 3) Rounds Won, 4) Alphabetical order.',
    },
    {
      id: 'faq-3',
      question: 'How does MVP selection work?',
      answer:
        'MVP is calculated via the impact formula: Impact = (Kills × 2.5) + (Damage / 100) + (Assists × 1.0) + ((Survival Seconds / 60) × 0.2) + (Revives × 1.5). The highest impact player in the selected scope (match or tournament) receives the MVP award.',
    },
    {
      id: 'faq-4',
      question: 'How do room credentials get sent to teams?',
      answer:
        'Once a match is created by tournament admins, Room ID and Password are secure and sent strictly to approved Team Leaders via private individual emails. They are never published on public leaderboards.',
    },
  ],
  contactText:
    'Need assistance with your registration, rule inquiries, or tournament schedules? Reach out to our tournament operations team.',
  contactEmail: 'tournaments@example.com',
  registrationEnabled: true,
};
