import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DemoDataTab } from '../components/creator/DemoDataTab';
import { AdminPage } from '../pages/AdminPage';
import { TimeoutError } from '../lib/timeout';
import * as demoDataService from '../services/demoDataService';
import * as tournamentService from '../services/tournamentService';

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('../components/ui/Toast', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
  }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'admin-1', email: 'dheerajsinghbaghel1306@gmail.com' },
    role: 'admin',
    loading: false,
  }),
}));

vi.mock('../context/GameContext', () => ({
  useGame: () => ({
    gameId: 'BGMI',
    game: {
      name: 'BGMI',
      placementPoints: { 1: 10, 2: 6, 3: 5 },
      killPoints: 1,
      mvpWeights: { kills: 2.5, damage: 0.01, assists: 1.0, survivalSeconds: 0.003, revives: 1.5 },
    },
    setGameId: vi.fn(),
  }),
}));

vi.mock('../hooks/useFirestoreCollection', () => ({
  useFirestoreCollection: () => ({
    data: [],
    loading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('../hooks/useLeaderboard', () => ({
  useLeaderboard: () => ({
    standings: [],
    loading: false,
  }),
}));

const EXACT_TIMEOUT_MSG =
  'Save is taking longer than expected. Its status is unknown; check the record when your connection returns before retrying.';

describe('Stage 1A: Spinner Lifecycle and Timeout Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DemoDataTab', () => {
    it('clears spinner and displays exact timeout toast when Firestore write times out', async () => {
      vi.spyOn(demoDataService, 'generateDemoData').mockImplementation(
        () => Promise.reject(new TimeoutError('Operation timed out after 10000ms', 10000, 'generateDemoData'))
      );

      render(<DemoDataTab />);
      const btn = screen.getByRole('button', { name: /generate demo data/i });

      fireEvent.click(btn);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Save Pending', EXACT_TIMEOUT_MSG);
      });

      await waitFor(() => {
        expect(btn).not.toBeDisabled();
      });
    });

    it('clears spinner and displays error toast when write is rejected', async () => {
      vi.spyOn(demoDataService, 'generateDemoData').mockRejectedValue(
        new Error('Network connection dropped')
      );

      render(<DemoDataTab />);
      const btn = screen.getByRole('button', { name: /generate demo data/i });

      fireEvent.click(btn);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Generation Error', 'Network connection dropped');
      });

      expect(btn).not.toBeDisabled();
    });

    it('prevents duplicate invocations on rapid double clicks while submitting', async () => {
      let resolvePromise: (val: { success: boolean; tournamentId: string; message: string }) => void;
      const deferred = new Promise<{ success: boolean; tournamentId: string; message: string }>((res) => {
        resolvePromise = res;
      });

      const generateSpy = vi.spyOn(demoDataService, 'generateDemoData').mockImplementation(() => deferred);

      render(<DemoDataTab />);
      const btn = screen.getByRole('button', { name: /generate demo data/i });

      fireEvent.click(btn);
      fireEvent.click(btn);

      expect(generateSpy).toHaveBeenCalledTimes(1);

      resolvePromise!({
        success: true,
        tournamentId: 'demo-123',
        message: 'Completed',
      });

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalled();
      });
    });

    it('safely handles unmount mid-request without throwing unhandled state update errors', async () => {
      let resolvePromise: (val: { success: boolean; tournamentId: string; message: string }) => void;
      const deferred = new Promise<{ success: boolean; tournamentId: string; message: string }>((res) => {
        resolvePromise = res;
      });

      vi.spyOn(demoDataService, 'generateDemoData').mockImplementation(() => deferred);

      const { unmount } = render(<DemoDataTab />);
      const btn = screen.getByRole('button', { name: /generate demo data/i });

      fireEvent.click(btn);
      unmount();

      resolvePromise!({
        success: true,
        tournamentId: 'demo-123',
        message: 'Completed',
      });

      expect(mockToastSuccess).not.toHaveBeenCalled();
    });
  });

  describe('AdminPage Tournament Creation/Update', () => {
    it('clears spinner and shows exact toast on timeout without closing modal or navigating away', async () => {
      vi.spyOn(tournamentService, 'createTournament').mockImplementation(
        () => Promise.reject(new TimeoutError('Operation timed out after 10000ms', 10000, 'createTournament'))
      );

      render(<AdminPage />);

      // Open Create Tournament modal
      const openModalBtn = screen.getByRole('button', { name: /create tournament/i });
      fireEvent.click(openModalBtn);

      const nameInput = screen.getByPlaceholderText(/Pro Championship Season 1/i);
      fireEvent.change(nameInput, { target: { value: 'Championship 2026' } });

      // Inside modal, find the form submit button
      const submitBtn = screen.getAllByRole('button', { name: /create tournament/i }).pop()!;
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Save Pending', EXACT_TIMEOUT_MSG);
      });

      // Button should be re-enabled and modal should remain open
      await waitFor(() => {
        expect(submitBtn).not.toBeDisabled();
      });
      expect(screen.getByPlaceholderText(/Pro Championship Season 1/i)).toBeInTheDocument();
      expect(mockToastSuccess).not.toHaveBeenCalled();
    });

    it('clears spinner and shows error toast when tournament creation is rejected', async () => {
      vi.spyOn(tournamentService, 'createTournament').mockRejectedValue(
        new Error('permission-denied')
      );

      render(<AdminPage />);
      fireEvent.click(screen.getByRole('button', { name: /create tournament/i }));

      const nameInput = screen.getByPlaceholderText(/Pro Championship Season 1/i);
      fireEvent.change(nameInput, { target: { value: 'Test Tournament' } });

      const submitBtn = screen.getAllByRole('button', { name: /create tournament/i }).pop()!;
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          'Save Failed',
          expect.stringContaining('Permission denied')
        );
      });

      expect(submitBtn).not.toBeDisabled();
    });

    it('prevents double submissions on rapid double clicks while saving tournament', async () => {
      let resolvePromise: (val: string) => void;
      const deferred = new Promise<string>((res) => {
        resolvePromise = res;
      });

      const createSpy = vi.spyOn(tournamentService, 'createTournament').mockImplementation(() => deferred);

      render(<AdminPage />);
      fireEvent.click(screen.getByRole('button', { name: /create tournament/i }));

      const nameInput = screen.getByPlaceholderText(/Pro Championship Season 1/i);
      fireEvent.change(nameInput, { target: { value: 'Rapid Click Tourney' } });

      const submitBtn = screen.getAllByRole('button', { name: /create tournament/i }).pop()!;

      // Click twice rapidly
      fireEvent.click(submitBtn);
      fireEvent.click(submitBtn);

      expect(createSpy).toHaveBeenCalledTimes(1);

      resolvePromise!('new-tourney-id');

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith(
          'Tournament Created',
          '"Rapid Click Tourney" created.'
        );
      });
    });

    it('safely handles unmount mid-request during tournament save', async () => {
      let resolvePromise: (val: string) => void;
      const deferred = new Promise<string>((res) => {
        resolvePromise = res;
      });

      vi.spyOn(tournamentService, 'createTournament').mockImplementation(() => deferred);

      const { unmount } = render(<AdminPage />);
      fireEvent.click(screen.getByRole('button', { name: /create tournament/i }));

      const nameInput = screen.getByPlaceholderText(/Pro Championship Season 1/i);
      fireEvent.change(nameInput, { target: { value: 'Unmounting Tourney' } });

      const submitBtn = screen.getAllByRole('button', { name: /create tournament/i }).pop()!;
      fireEvent.click(submitBtn);

      unmount();

      resolvePromise!('new-tourney-id');

      // Post unmount: success toast should not be called
      expect(mockToastSuccess).not.toHaveBeenCalled();
    });
  });
});
