import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { AwardBadges } from '../components/leaderboard/AwardBadges';

describe('Leaderboard Component Crash Resilience (Rule 0.7)', () => {
  it('renders safely with undefined standings prop without crashing', () => {
    render(<LeaderboardTable standings={undefined as any} gameId="BGMI" />);
    expect(screen.getByText(/No standings recorded yet/i)).toBeInTheDocument();
  });

  it('renders safely with empty array [] without crashing', () => {
    render(<LeaderboardTable standings={[]} gameId="BGMI" />);
    expect(screen.getByText(/No standings recorded yet/i)).toBeInTheDocument();
  });

  it('renders safely with malformed team data containing missing/undefined fields', () => {
    const malformedData: any = [
      {
        rank: undefined,
        teamId: undefined,
        teamName: undefined,
        matchesPlayed: undefined,
        placementPoints: undefined,
        killPoints: undefined,
        totalKills: undefined,
        totalPoints: undefined,
        wwcdCount: undefined,
      },
      {
        rank: 2,
        teamId: 't2',
        teamName: 'Glitch Squad',
        matchesPlayed: 1,
        placementPoints: 0, // 0 should be rendered, not fallback string
        killPoints: 0,
        totalKills: 0,
        totalPoints: 0,
        wwcdCount: 0,
      },
    ];

    expect(() => {
      render(<LeaderboardTable standings={malformedData} gameId="BGMI" />);
    }).not.toThrow();

    expect(screen.getAllByText('Glitch Squad')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Unknown')[0]).toBeInTheDocument();
  });

  it('renders AwardBadges safely with null awards', () => {
    render(<AwardBadges mvp={null} topFragger={null} />);
    expect(screen.getByText(/MVP unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Top Fragger unavailable/i)).toBeInTheDocument();
  });
});
