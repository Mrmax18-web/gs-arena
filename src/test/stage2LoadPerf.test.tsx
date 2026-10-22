import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TwistRibbon } from '../components/backgrounds/TwistRibbon';
import { BackgroundProvider } from '../context/BackgroundContext';

// Mock WebGL2 context
const mockGl = {
  createShader: vi.fn(() => ({})),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  getShaderInfoLog: vi.fn(() => ''),
  createProgram: vi.fn(() => ({})),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  getProgramInfoLog: vi.fn(() => ''),
  useProgram: vi.fn(),
  createBuffer: vi.fn(() => ({})),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  getAttribLocation: vi.fn(() => 0),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  getUniformLocation: vi.fn(() => ({})),
  viewport: vi.fn(),
  uniform1f: vi.fn(),
  uniform2f: vi.fn(),
  uniform3f: vi.fn(),
  drawArrays: vi.fn(),
  deleteShader: vi.fn(),
  deleteProgram: vi.fn(),
  deleteBuffer: vi.fn(),
};

describe('Stage 2: TwistRibbon WebGL Optimization & Lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextType: string) => {
      if (contextType === 'webgl2') return mockGl;
      return null;
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('defers mounting WebGL context by ~500ms after first paint', () => {
    render(
      <BackgroundProvider>
        <TwistRibbon />
      </BackgroundProvider>
    );

    // Initial paint: should render static non-blocking placeholder (no canvas yet)
    expect(document.querySelector('canvas')).toBeNull();

    // Fast-forward 499ms: still placeholder
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(document.querySelector('canvas')).toBeNull();

    // Advance to 500ms: WebGL canvas mounts
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(document.querySelector('canvas')).not.toBeNull();
  });

  it('clears deferral timer cleanly on unmount before 500ms', () => {
    const { unmount } = render(
      <BackgroundProvider>
        <TwistRibbon />
      </BackgroundProvider>
    );

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(document.querySelector('canvas')).toBeNull();

    unmount();

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(document.querySelector('canvas')).toBeNull();
  });

  it('respects prefers-reduced-motion by drawing static frame without continuous RAF', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    const { unmount } = render(
      <BackgroundProvider>
        <TwistRibbon />
      </BackgroundProvider>
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should draw single initial frame to canvas
    expect(mockGl.drawArrays).toHaveBeenCalledTimes(1);
    // Should NOT schedule continuous requestAnimationFrame
    expect(rafSpy).not.toHaveBeenCalled();

    unmount();
    window.matchMedia = originalMatchMedia;
  });

  it('disposes WebGL shaders, program, and buffer on unmount', () => {
    const { unmount } = render(
      <BackgroundProvider>
        <TwistRibbon />
      </BackgroundProvider>
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockGl.createProgram).toHaveBeenCalledTimes(1);

    unmount();

    expect(mockGl.deleteShader).toHaveBeenCalledTimes(2); // Vertex and Fragment
    expect(mockGl.deleteProgram).toHaveBeenCalledTimes(1);
    expect(mockGl.deleteBuffer).toHaveBeenCalledTimes(1);
  });
});

describe('Stage 2: useLeaderboard Listener & Query Integrity', () => {
  it('does not artificially limit matches or teams, ensuring complete standings calculation', async () => {
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

    // Verify constraints do NOT contain limit
    for (const constraints of passedConstraints) {
      const hasLimit = constraints.some(
        (c: unknown) => typeof c === 'object' && c !== null && (c as { type?: string }).type === 'limit'
      );
      expect(hasLimit).toBe(false);
    }

    // Verify cleanup unsubscribes both listeners on unmount
    unmount();
    expect(unsubMatchesSpy).toHaveBeenCalledTimes(1);
    expect(unsubTeamsSpy).toHaveBeenCalledTimes(1);
  });
});

