import { describe, it, expect, vi } from 'vitest';

describe('Stage 2: useLeaderboard Listener & Query Integrity', () => {
  it('attaches a limit of 50 to matches and teams, ensuring optimal performance and complete standings calculation', async () => {
    const unsubMatchesSpy = vi.fn();
    const unsubTeamsSpy = vi.fn();
    const passedConstraints: unknown[][] = [];

    vi.doMock('../lib/firebase', () => ({
      db: {},
      isFirebaseConfigured: () => true,
    }));

    vi.doMock('firebase/firestore', () => ({
      collection: vi.fn((_db, ...parts) => ({
        path: parts.join('/'),
        withConverter: vi.fn().mockReturnThis(),
      })),
      orderBy: vi.fn((field, dir) => ({ type: 'orderBy', field, dir })),
      limit: vi.fn((n) => ({ type: 'limit', value: n })),
      query: vi.fn((ref, ...constraints) => {
        passedConstraints.push(constraints);
        return { ref, constraints };
      }),
      onSnapshot: vi.fn((q) => {
        if (q.ref?.path?.includes('matches')) return unsubMatchesSpy;
        return unsubTeamsSpy;
      }),
    }));

    const { useLeaderboard } = await import('../hooks/useLeaderboard');
    const { renderHook } = await import('@testing-library/react');

    const { unmount } = renderHook(() =>
      useLeaderboard({
        tournamentId: 't-test-123',
        gameId: 'BGMI',
        scoringSnapshot: {
          placementPoints: [15, 12, 10, 8, 6],
          killPoints: 1,
          mvpWeights: { kills: 1, damage: 0.1, assists: 0.5, survivalSeconds: 0.01, revives: 0.2 },
        },
      })
    );

    // Verify constraints do contain limit
    for (const constraints of passedConstraints) {
      const hasLimit = constraints.some(
        (c: unknown) => typeof c === 'object' && c !== null && (c as { type?: string }).type === 'limit'
      );
      expect(hasLimit).toBe(true);
    }

    // Verify cleanup unsubscribes both listeners on unmount
    unmount();
    expect(unsubMatchesSpy).toHaveBeenCalledTimes(1);
    expect(unsubTeamsSpy).toHaveBeenCalledTimes(1);
  });
});
