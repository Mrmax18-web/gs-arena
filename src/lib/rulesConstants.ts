export const RULES_VERSION = '1.0';

export interface TournamentRule {
  id: string;
  title: string;
  shortSummary: string;
  fullPolicy: string;
  badge: string;
  severity: 'CRITICAL' | 'STRICT' | 'STANDARD';
}

export const MANDATORY_POLICIES: TournamentRule[] = [
  {
    id: 'no-rematch',
    title: 'No Rematch Policy',
    shortSummary: 'Automatic loss if team is not present at scheduled time.',
    fullPolicy:
      'If your team is not present in the room lobby at the scheduled start time, it will result in an automatic loss. No rematches, delays, or rescheduled matches will be provided under any circumstances.',
    badge: 'Zero Tolerance',
    severity: 'CRITICAL',
  },
  {
    id: 'device-policy',
    title: 'Device Policy',
    shortSummary: 'Mobile phones only. Emulators, tablets, and iPads strictly prohibited.',
    fullPolicy:
      'Emulators (BlueStacks, LDPlayer, Gameloop, etc.), tablets, iPads, and peripheral trigger attachments are strictly prohibited. Participants must play solely on handheld mobile smartphones. Violation results in instant disqualification and forfeiture.',
    badge: 'Hardware Lockdown',
    severity: 'CRITICAL',
  },
  {
    id: 'anti-cheat-teaming',
    title: 'Hacking & Teaming Prohibition',
    shortSummary: 'Third-party tools or opponent collusion equals permanent ban.',
    fullPolicy:
      'Any use of third-party software, scripts, modified game clients, crosshair overlays, memory modifications, or collusive teaming with opponents will result in an immediate match forfeit and a permanent global ban across all GS Arena operations and affiliated leagues.',
    badge: 'Permanent Ban',
    severity: 'CRITICAL',
  },
];

export const RULES_DISCLAIMER =
  'By registering for any GS Arena event, the Team Leader and all 4 roster players legally bind themselves to these mandatory policies. Violations are logged and adjudicated without appeal.';
