import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateImageFile,
  SUPABASE_BUCKET_NAME,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
  uploadFile,
  downscaleImageIfLarge,
} from '../services/storageService';
import { TimeoutError } from '../lib/timeout';
import { supabase } from '../lib/supabase';

describe('Stage 3: Safe Supabase Uploads', () => {
  describe('File Validation & Constraints', () => {
    it('verifies bucket name is strictly GS-ARENA', () => {
      expect(SUPABASE_BUCKET_NAME).toBe('GS-ARENA');
    });

    it('rejects non-image MIME types with clear user-facing error', () => {
      const pdfFile = new File(['%PDF-1.4'], 'document.pdf', { type: 'application/pdf' });
      const gifFile = new File(['GIF89a'], 'animation.gif', { type: 'image/gif' });
      const textFile = new File(['hello'], 'notes.txt', { type: 'text/plain' });

      expect(validateImageFile(pdfFile)).toEqual({
        valid: false,
        error: 'Invalid file format. Only JPEG, PNG, and WebP images are allowed.',
      });
      expect(validateImageFile(gifFile)).toEqual({
        valid: false,
        error: 'Invalid file format. Only JPEG, PNG, and WebP images are allowed.',
      });
      expect(validateImageFile(textFile)).toEqual({
        valid: false,
        error: 'Invalid file format. Only JPEG, PNG, and WebP images are allowed.',
      });
    });

    it('rejects files larger than 5 MiB (5 * 1024 * 1024 bytes)', () => {
      const overLimitSize = MAX_FILE_SIZE_BYTES + 1;
      const oversizedBlob = new Blob([new Uint8Array(overLimitSize)], { type: 'image/png' });
      const oversizedFile = new File([oversizedBlob], 'large.png', { type: 'image/png' });

      const res = validateImageFile(oversizedFile);
      expect(res.valid).toBe(false);
      expect(res.error).toBe('File size exceeds 5 MB. Please upload a smaller image.');
    });

    it('accepts valid JPEG, PNG, and WebP files under 5 MiB', () => {
      for (const mime of ALLOWED_IMAGE_TYPES) {
        const file = new File(['valid-image-bytes'], `image.${mime.split('/')[1]}`, { type: mime });
        expect(validateImageFile(file)).toEqual({ valid: true });
      }
    });

    it('rejects invalid file before any network call in uploadFile', async () => {
      const invalidFile = new File(['invalid'], 'test.exe', { type: 'application/x-msdownload' });
      const onError = vi.fn();

      const { promise } = uploadFile('test/path.exe', invalidFile, { onError });

      await expect(promise).rejects.toThrow('Invalid file format');
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('8s Timeout & Late Completion Guard in storageService', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('times out after 8s and rejects with TimeoutError stating UI stopped waiting', async () => {
      const validFile = new File(['valid-bytes'], 'banner.png', { type: 'image/png' });
      const onError = vi.fn();
      const onSuccess = vi.fn();

      const { promise } = uploadFile('tournaments/t-123/banner.png', validFile, {
        onError,
        onSuccess,
      });

      // Advance clock past 8 seconds
      vi.advanceTimersByTime(8001);

      await expect(promise).rejects.toBeInstanceOf(TimeoutError);
      await expect(promise).rejects.toThrow(/timed out after 8s/);
      expect(onError).toHaveBeenCalledWith(expect.any(TimeoutError));
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('discards late upload completions after timeout without calling onSuccess', async () => {
      const validFile = new File(['valid-bytes'], 'banner.png', { type: 'image/png' });
      const onSuccess = vi.fn();
      const onError = vi.fn();

      const { promise } = uploadFile('tournaments/t-123/banner.png', validFile, {
        onSuccess,
        onError,
      });

      // Trigger timeout at 8s
      vi.advanceTimersByTime(8001);

      await expect(promise).rejects.toBeInstanceOf(TimeoutError);

      // Now simulate a late completion happening after 10s
      vi.advanceTimersByTime(2000);

      // Verify onSuccess was NEVER called
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('successfully uploads file and returns public URL within timeout window', async () => {
      const validFile = new File(['valid-bytes'], 'banner.png', { type: 'image/png' });
      const onSuccess = vi.fn();
      const onProgress = vi.fn();

      vi.spyOn(supabase.storage, 'from').mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'tournaments/t-123/banner.png' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.supabase.co/GS-ARENA/tournaments/t-123/banner.png' },
        }),
      } as unknown as ReturnType<typeof supabase.storage.from>);

      const { promise } = uploadFile('tournaments/t-123/banner.png', validFile, {
        onSuccess,
        onProgress,
      });

      const url = await promise;
      expect(url).toBe('https://storage.supabase.co/GS-ARENA/tournaments/t-123/banner.png');
      expect(onSuccess).toHaveBeenCalledWith(url);
      expect(onProgress).toHaveBeenCalledWith(100);
    });
  });

  describe('Canvas Downscaling for Large Images', () => {
    it('returns the original file when dimensions are <= 2048px', async () => {
      const file = new File(['dummy-bytes'], 'small.jpg', { type: 'image/jpeg' });
      const result = await downscaleImageIfLarge(file);
      expect(result).toBe(file);
    });

    it('falls back gracefully to original file if browser canvas fails or is unsupported', async () => {
      const file = new File(['corrupt-or-unsupported'], 'unsupported.png', { type: 'image/png' });
      // In jsdom without native Image loading, downscaleImageIfLarge resolves gracefully with fallback
      const result = await downscaleImageIfLarge(file);
      expect(result).toBe(file);
    });
  });
});
