import { describe, it, expect } from 'vitest';
import {
  calculateBRMatchPoints,
  computeTournamentStandingsBR,
  computeTournamentStandingsCS,
  getPlacementPoints,
} from '../lib/scoring';
import { DEFAULT_BGMI_CONFIG, DEFAULT_FF_BR_CONFIG } from '../lib/constants';
import { Match, ScoringSnapshot } from '../types/tournament';

describe('Scoring Logic', () => {
  const bgmiSnapshot: ScoringSnapshot = {
    placementPoints: DEFAULT_BGMI_CONFIG.placementPoints,
    killPoints: DEFAULT_BGMI_CONFIG.killPoints,
    mvpWeights: DEFAULT_BGMI_CONFIG.mvpWeights,
  };

  const ffBrSnapshot: ScoringSnapshot = {
    placementPoints: DEFAULT_FF_BR_CONFIG.placementPoints,
    killPoints: DEFAULT_FF_BR_CONFIG.killPoints,
    mvpWeights: DEFAULT_FF_BR_CONFIG.mvpWeights,
  };

  it('calculates BGMI match points correctly with worked example (10 + 9 = 19)', () => {
    // Spec worked example: placement 1 with 9 team kills in BGMI gives 10 + 9*1 = 19
    const points = calculateBRMatchPoints(1, 9, bgmiSnapshot);
    expect(points.placementPoints).toBe(10);
    expect(points.killPoints).toBe(9);
    expect(points.totalPoints).toBe(19);
  });

  it('calculates FF_BR match points correctly (1st place = 12 pts)', () => {
    const points = calculateBRMatchPoints(1, 5, ffBrSnapshot);
    expect(points.placementPoints).toBe(12);
    expect(points.killPoints).toBe(5);
    expect(points.totalPoints).toBe(17);
  });

  it('handles placement beyond points table safely (9th+ = 0 in BGMI)', () => {
    const pts9 = getPlacementPoints(9, bgmiSnapshot);
    const pts16 = getPlacementPoints(16, bgmiSnapshot);
    const pts99 = getPlacementPoints(99, bgmiSnapshot);
    expect(pts9).toBe(0);
    expect(pts16).toBe(0);
    expect(pts99).toBe(0);
  });

  describe('Battle Royale Tie-Breakers', () => {
    it('breaks ties using the 6-stage tie-breaker rules', () => {
      // Tie breaker 1: Total points
      // Tie breaker 2: Total placement points
      // Tie breaker 3: Total kills
      // Tie breaker 4: 1st place finishes (WWCD)
      // Tie breaker 5: Best placement in latest match
      // Tie breaker 6: Alphabetical

      const match1: Match = {
        id: 'm1',
        tournamentId: 't1',
        matchNumber: 1,
        scheduledAt: '',
        map: 'Erangel',
        status: 'completed',
        results: [
          {
            teamId: 'team-high-pts',
            teamName: 'High Pts',
            placement: 1, // 10 pts
            kills: 5,     // 5 pts -> total 15
            placementPoints: 10,
            killPoints: 5,
            totalPoints: 15,
            playerStats: [],
          },
          {
            teamId: 'team-low-pts',
            teamName: 'Low Pts',
            placement: 2, // 6 pts
            kills: 2,     // 2 pts -> total 8
            placementPoints: 6,
            killPoints: 2,
            totalPoints: 8,
            playerStats: [],
          },
        ],
      };

      const standings1 = computeTournamentStandingsBR([match1], bgmiSnapshot);
      expect(standings1[0].teamId).toBe('team-high-pts');
      expect(standings1[1].teamId).toBe('team-low-pts');

      // Tie breaker 2: Same total points, more placement points wins
      const matchTiePlacement: Match = {
        id: 'm-tp',
        tournamentId: 't1',
        matchNumber: 1,
        scheduledAt: '',
        map: 'Erangel',
        status: 'completed',
        results: [
          {
            teamId: 'more-placement',
            teamName: 'Placement Kings',
            placement: 2, // 6 pts
            kills: 4,     // 4 pts -> total 10
            placementPoints: 6,
            killPoints: 4,
            totalPoints: 10,
            playerStats: [],
          },
          {
            teamId: 'more-kills',
            teamName: 'Kill Seekers',
            placement: 4, // 4 pts
            kills: 6,     // 6 pts -> total 10
            placementPoints: 4,
            killPoints: 6,
            totalPoints: 10,
            playerStats: [],
          },
        ],
      };
      const standings2 = computeTournamentStandingsBR([matchTiePlacement], bgmiSnapshot);
      expect(standings2[0].teamId).toBe('more-placement');
      expect(standings2[1].teamId).toBe('more-kills');

      // Tie breaker 4: Same points, same placement, same kills -> WWCD count wins
      const matchTieWWCD_1: Match = {
        id: 'm1',
        tournamentId: 't1',
        matchNumber: 1,
        scheduledAt: '',
        map: 'Erangel',
        status: 'completed',
        results: [
          { teamId: 'team-wwcd', teamName: 'WWCD Team', placement: 1, kills: 0, placementPoints: 10, killPoints: 0, totalPoints: 10, playerStats: [] },
          { teamId: 'team-nowwcd', teamName: 'No WWCD Team', placement: 2, kills: 4, placementPoints: 6, killPoints: 4, totalPoints: 10, playerStats: [] },
        ],
      };
      const matchTieWWCD_2: Match = {
        id: 'm2',
        tournamentId: 't1',
        matchNumber: 2,
        scheduledAt: '',
        map: 'Erangel',
        status: 'completed',
        results: [
          { teamId: 'team-wwcd', teamName: 'WWCD Team', placement: 5, kills: 7, placementPoints: 3, killPoints: 7, totalPoints: 10, playerStats: [] },
          { teamId: 'team-nowwcd', teamName: 'No WWCD Team', placement: 2, kills: 1, placementPoints: 6, killPoints: 1, totalPoints: 7, playerStats: [] },
        ],
      };
      // team-wwcd: 10+10 = 20 pts, 13 placement, 7 kills, 1 WWCD
      // team-nowwcd: 10+7 = 17 pts -> team-wwcd wins
      const standingsWWCD = computeTournamentStandingsBR([matchTieWWCD_1, matchTieWWCD_2], bgmiSnapshot);
      expect(standingsWWCD[0].teamId).toBe('team-wwcd');
    });

    it('safely handles empty match array or matches with no completed status', () => {
      const emptyStandings = computeTournamentStandingsBR([], bgmiSnapshot);
      expect(emptyStandings).toEqual([]);

      const draftMatch: Match = {
        id: 'draft',
        tournamentId: 't1',
        matchNumber: 1,
        scheduledAt: '',
        map: 'Erangel',
        status: 'scheduled',
        results: [],
      };
      const draftStandings = computeTournamentStandingsBR([draftMatch], bgmiSnapshot);
      expect(draftStandings).toEqual([]);
    });
  });

  describe('Clash Squad Standings and Tie-Breakers', () => {
    const csSnapshot: ScoringSnapshot = {
      placementPoints: [],
      killPoints: 0,
      matchWinPoints: 1,
      mvpWeights: DEFAULT_BGMI_CONFIG.mvpWeights,
    };

    it('calculates CS standings: match wins, round difference, then rounds won', () => {
      const match: Match = {
        id: 'cs1',
        tournamentId: 't1',
        matchNumber: 1,
        scheduledAt: '',
        map: 'Bermuda',
        status: 'completed',
        results: [
          {
            teamId: 'team-a',
            teamName: 'Team Alpha',
            placement: 1,
            kills: 8,
            placementPoints: 0,
            killPoints: 0,
            totalPoints: 1,
            roundsWon: 4,
            roundsLost: 1, // diff = +3
            playerStats: [],
          },
          {
            teamId: 'team-b',
            teamName: 'Team Beta',
            placement: 2,
            kills: 3,
            placementPoints: 0,
            killPoints: 0,
            totalPoints: 0,
            roundsWon: 1,
            roundsLost: 4, // diff = -3
            playerStats: [],
          },
        ],
      };

      const standings = computeTournamentStandingsCS([match], csSnapshot);
      expect(standings.length).toBe(2);
      expect(standings[0].teamId).toBe('team-a');
      expect(standings[0].matchWins).toBe(1);
      expect(standings[0].roundDifference).toBe(3);
      expect(standings[0].isLeader).toBe(true);

      expect(standings[1].teamId).toBe('team-b');
      expect(standings[1].matchWins).toBe(0);
      expect(standings[1].roundDifference).toBe(-3);
    });
  });
});
