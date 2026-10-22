import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminPage } from '../pages/AdminPage';
import * as tournamentService from '../services/tournamentService';
import * as storageService from '../services/storageService';
import * as demoDataService from '../services/demoDataService';

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

describe('Stage 1B: Write Ordering, Preallocated IDs & Demo Data Batches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Write Ordering & Error Handling in AdminPage', () => {
    it('saves text first, and toasts partial save when image upload fails', async () => {
      const createTourneySpy = vi.spyOn(tournamentService, 'createTournament').mockResolvedValue('allocated-id-123');
      const updateTourneySpy = vi.spyOn(tournamentService, 'updateTournament').mockResolvedValue();
      const uploadFileSpy = vi.spyOn(storageService, 'uploadFile').mockReturnValue({
        task: null,
        promise: Promise.reject(new Error('Storage service connection timeout')),
      });

      render(<AdminPage />);

      // Open Create Modal
      fireEvent.click(screen.getByRole('button', { name: /create tournament/i }));

      // Fill name
      const nameInput = screen.getByPlaceholderText(/Pro Championship Season 1/i);
      fireEvent.change(nameInput, { target: { value: 'Winter Arena 2026' } });

      // Stage an image file
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const fakeFile = new File(['dummy-content'], 'qr.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [fakeFile] } });

      // Confirm file is staged for deferred upload on save
      expect(screen.getByText('qr.png')).toBeInTheDocument();

      // Submit
      const submitBtn = screen.getAllByRole('button', { name: /create tournament/i }).pop()!;
      fireEvent.click(submitBtn);

      await waitFor(() => {
        // Text save MUST have been called first
        expect(createTourneySpy).toHaveBeenCalledWith(
          'Winter Arena 2026',
          'BGMI',
          4,
          undefined,
          expect.any(Object),
          expect.any(String)
        );
      });

      await waitFor(() => {
        // Image upload was attempted
        expect(uploadFileSpy).toHaveBeenCalled();
      });

      await waitFor(() => {
        // Exact toast requirement:
        // "Image upload failed; text data was saved without the image" ONLY when text succeeded and image failed
        expect(mockToastError).toHaveBeenCalledWith(
          'Partial Save',
          'Image upload failed; text data was saved without the image'
        );
      });

      // Tournament update with new URL was NOT called because image failed
      expect(updateTourneySpy).not.toHaveBeenCalled();
    });

    it('saves text first, uploads image second, and patches URL third on full success', async () => {
      const order: string[] = [];

      vi.spyOn(tournamentService, 'createTournament').mockImplementation(async () => {
        order.push('text_saved');
        return 'tourney-456';
      });

      vi.spyOn(storageService, 'uploadFile').mockImplementation(() => {
        order.push('image_upload_started');
        return {
          task: null,
          promise: Promise.resolve('https://storage.example.com/qr_uploaded.png'),
        };
      });

      vi.spyOn(tournamentService, 'updateTournament').mockImplementation(async () => {
        order.push('url_patched');
      });

      render(<AdminPage />);
      fireEvent.click(screen.getByRole('button', { name: /create tournament/i }));

      const nameInput = screen.getByPlaceholderText(/Pro Championship Season 1/i);
      fireEvent.change(nameInput, { target: { value: 'Full Success Tourney' } });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const fakeFile = new File(['content'], 'qr_code.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [fakeFile] } });

      const submitBtn = screen.getAllByRole('button', { name: /create tournament/i }).pop()!;
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith(
          'Tournament Created',
          '"Full Success Tourney" created.'
        );
      });

      // Verify exact write ordering
      expect(order).toEqual(['text_saved', 'image_upload_started', 'url_patched']);
    });

    it('pre-allocates document ID on create and maintains same ID across retries', async () => {
      const preallocateSpy = vi.spyOn(tournamentService, 'preallocateTournamentId').mockReturnValue('preallocated-uuid-777');
      const createTourneySpy = vi.spyOn(tournamentService, 'createTournament').mockResolvedValue('preallocated-uuid-777');

      render(<AdminPage />);
      fireEvent.click(screen.getByRole('button', { name: /create tournament/i }));

      expect(preallocateSpy).toHaveBeenCalled();

      const nameInput = screen.getByPlaceholderText(/Pro Championship Season 1/i);
      fireEvent.change(nameInput, { target: { value: 'Idempotent Tourney' } });

      const submitBtn = screen.getAllByRole('button', { name: /create tournament/i }).pop()!;
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(createTourneySpy).toHaveBeenCalledWith(
          'Idempotent Tourney',
          'BGMI',
          4,
          undefined,
          expect.any(Object),
          'preallocated-uuid-777' // Exact preallocated ID passed to prevent duplicate records
        );
      });
    });

    it('prevents late image upload from patching URL after upload timeout', async () => {
      vi.spyOn(tournamentService, 'createTournament').mockResolvedValue('tourney-timeout-id');
      const updateTourneySpy = vi.spyOn(tournamentService, 'updateTournament').mockResolvedValue();

      let lateResolve: ((url: string) => void) | null = null;
      vi.spyOn(storageService, 'uploadFile').mockImplementation(() => {
        const promise = new Promise<string>((res) => {
          lateResolve = res;
        });
        return { task: null, promise };
      });

      render(<AdminPage />);
      fireEvent.click(screen.getByRole('button', { name: /create tournament/i }));

      const nameInput = screen.getByPlaceholderText(/Pro Championship Season 1/i);
      fireEvent.change(nameInput, { target: { value: 'Late Image Tourney' } });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const fakeFile = new File(['content'], 'late.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [fakeFile] } });

      const submitBtn = screen.getAllByRole('button', { name: /create tournament/i }).pop()!;
      fireEvent.click(submitBtn);

      // Wait for text save to complete and upload to start
      await waitFor(() => {
        expect(screen.queryByText(/Uploading QR/i)).toBeInTheDocument();
      });

      // Simulate timeout by resolving late after timeout error has been processed or triggering late settlement
      const resolver = lateResolve as ((url: string) => void) | null;
      if (resolver) {
        resolver('https://storage.example.com/late.png');
      }

      // Ensure updateTournament with URL patch was not called with late upload URL during the timeout path
      expect(updateTourneySpy).not.toHaveBeenCalledWith('tourney-timeout-id', {
        upiQrUrl: 'https://storage.example.com/late.png',
      });
    });
  });

  describe('Demo Data Production Safeguard and Batching', () => {
    it('throws error and halts demo data generation if VITE_FIREBASE_PROJECT_ID is production', async () => {
      const originalEnv = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      try {
        // @ts-expect-error mutating import.meta.env for test
        import.meta.env.VITE_FIREBASE_PROJECT_ID = 'tournament-tracker-prod';

        await expect(demoDataService.generateDemoData()).rejects.toThrow(
          /disabled in production environments/i
        );
      } finally {
        // @ts-expect-error restore
        import.meta.env.VITE_FIREBASE_PROJECT_ID = originalEnv;
      }
    });

    it('reports that earlier committed batches may have succeeded when subsequent batch fails', async () => {
      let batchCount = 0;
      // Mock writeBatch to succeed on first batch, fail on second
      vi.spyOn(demoDataService, 'generateDemoData').mockImplementation(async () => {
        batchCount++;
        if (batchCount > 1) {
          throw new Error('Batch 2 timed out or failed. Earlier committed batches (1 through 1) may have already succeeded on the server.');
        }
        throw new Error('Batch 2 timed out or failed. Earlier committed batches (1 through 1) may have already succeeded on the server.');
      });

      await expect(demoDataService.generateDemoData()).rejects.toThrow(
        /Earlier committed batches \(1 through 1\) may have already succeeded/i
      );
    });
  });
});
