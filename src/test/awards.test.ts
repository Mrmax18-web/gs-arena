import { describe, it, expect } from 'vitest';
import {
  calculateMvpImpact,
  findMatchMvp,
  findTournamentMvp,
  findMatchTopFragger,
  findTournamentTopFragger,
} from '../lib/awards';
import { DEFAULT_MVP_WEIGHTS } from '../lib/constants';
import { Match } from '../types/tournament';

describe('MVP and Top Fragger Awards Logic', () => {
  it('calculates MVP impact score according to the exact spec worked check', () => {
    // Spec worked check: kills 5, damage 800, assists 2, survival 1500 s, revives 1 gives 12.5 + 8 + 2 + 5 + 1.5 = 29.0
    const impact = calculateMvpImpact(
      {
        kills: 5,
        damage: 800,
        assists: 2,
        survivalSeconds: 1500,
        revives: 1,
      },
      DEFAULT_MVP_WEIGHTS
    );

    expect(impact).toBe(29.0);
  });

  it('treats missing player stats as 0 safely', () => {
    const impact = calculateMvpImpact({
      kills: 3,
    });
    // 3 * 2.5 = 7.5
    expect(impact).toBe(7.5);

    const emptyImpact = calculateMvpImpact(null);
    expect(emptyImpact).toBe(0);
  });

  it('returns null when no player-level stats exist (MVP unavailable)', () => {
    const matchWithoutPlayers: Match = {
      id: 'm1',
      tournamentId: 't1',
      matchNumber: 1,
      scheduledAt: '',
      map: 'Erangel',
      status: 'completed',
      results: [
        {
          teamId: 't1',
          teamName: 'Team 1',
          placement: 1,
          kills: 10,
          placementPoints: 10,
          killPoints: 10,
          totalPoints: 20,
          playerStats: [], // No individual stats
        },
      ],
    };

    expect(findMatchMvp(matchWithoutPlayers)).toBeNull();
    expect(findTournamentMvp([matchWithoutPlayers])).toBeNull();
    expect(findMatchTopFragger(matchWithoutPlayers)).toBeNull();
    expect(findTournamentTopFragger([matchWithoutPlayers])).toBeNull();
  });

  it('correctly labels match MVP and tournament MVP with scope', () => {
    const match: Match = {
      id: 'm3',
      tournamentId: 't1',
      matchNumber: 3,
      scheduledAt: '',
      map: 'Miramar',
      status: 'completed',
      results: [
        {
          teamId: 'team-gods',
          teamName: 'Gods of War',
          placement: 1,
          kills: 6,
          placementPoints: 10,
          killPoints: 6,
          totalPoints: 16,
          playerStats: [
            {
              playerId: 'p1',
              playerName: 'Jonathan',
              kills: 4,
              damage: 750,
              assists: 1,
              survivalSeconds: 1400,
              revives: 0,
            },
            {
              playerId: 'p2',
              playerName: 'Goblin',
              kills: 2,
              damage: 300,
              assists: 2,
              survivalSeconds: 1400,
              revives: 2,
            },
          ],
        },
      ],
    };

    const matchMvp = findMatchMvp(match);
    expect(matchMvp).not.toBeNull();
    expect(matchMvp?.playerName).toBe('Jonathan');
    expect(matchMvp?.scope).toBe('Match 3');

    const tournamentMvp = findTournamentMvp([match], DEFAULT_MVP_WEIGHTS, 'Tournament');
    expect(tournamentMvp).not.toBeNull();
    expect(tournamentMvp?.playerName).toBe('Jonathan');
    expect(tournamentMvp?.scope).toBe('Tournament');
  });

  it('breaks Top Fragger ties by fewer matches played, then alphabetical name', () => {
    const match1: Match = {
      id: 'm1',
      tournamentId: 't1',
      matchNumber: 1,
      scheduledAt: '',
      map: 'Erangel',
      status: 'completed',
      results: [
        {
          teamId: 'team1',
          teamName: 'Team 1',
          placement: 1,
          kills: 5,
          placementPoints: 10,
          killPoints: 5,
          totalPoints: 15,
          playerStats: [
            { playerId: 'player-b', playerName: 'Bob', kills: 5, damage: 500, assists: 0, survivalSeconds: 600, revives: 0 },
          ],
        },
      ],
    };

    const match2: Match = {
      id: 'm2',
      tournamentId: 't1',
      matchNumber: 2,
      scheduledAt: '',
      map: 'Erangel',
      status: 'completed',
      results: [
        {
          teamId: 'team2',
          teamName: 'Team 2',
          placement: 2,
          kills: 2,
          placementPoints: 6,
          killPoints: 2,
          totalPoints: 8,
          playerStats: [
            // Alice also has 5 kills across 2 matches (3 in match 2, plus 2 in match 1)
            { playerId: 'player-a', playerName: 'Alice', kills: 5, damage: 500, assists: 0, survivalSeconds: 600, revives: 0 },
          ],
        },
        {
          teamId: 'team1',
          teamName: 'Team 1',
          placement: 1,
          kills: 0,
          placementPoints: 10,
          killPoints: 0,
          totalPoints: 10,
          playerStats: [
            // Bob played match 2 but got 0 kills (total 5 kills, 2 matches)
            { playerId: 'player-b', playerName: 'Bob', kills: 0, damage: 100, assists: 0, survivalSeconds: 300, revives: 0 },
          ],
        },
      ],
    };

    // In match 1 alone, Bob has 5 kills in 1 match -> top fragger
    const tfMatch1 = findMatchTopFragger(match1);
    expect(tfMatch1?.playerName).toBe('Bob');
    expect(tfMatch1?.score).toBe(5);

    // Across matches 1 and 2:
    // Bob has 5 kills in 2 matches.
    // Alice has 5 kills in 1 match (only played in match 2).
    // Alice wins because she has fewer matches played (1 vs 2)!
    const tfTournament = findTournamentTopFragger([match1, match2]);
    expect(tfTournament?.playerName).toBe('Alice');
    expect(tfTournament?.score).toBe(5);
  });
});
