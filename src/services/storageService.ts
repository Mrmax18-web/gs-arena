import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { TimeoutError } from '../lib/timeout';

export const SUPABASE_BUCKET_NAME = 'GS-ARENA';
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates image file type and client-side size restrictions before any upload.
 *
 * @param file - The candidate File to validate.
 * @returns An object indicating validity and optional error description.
 */
export function validateImageFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file format. Only JPEG, PNG, and WebP images are allowed.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'File size exceeds 5 MB. Please upload a smaller image.',
    };
  }

  return { valid: true };
}

/**
 * Sanitizes a storage filename to prevent path traversal or special character corruption.
 *
 * @param originalName - Original filename from client.
 * @param prefix - Optional directory prefix.
 * @returns Clean path safe for storage key.
 */
export function sanitizeStorageFilename(originalName: string, prefix = ''): string {
  const parts = originalName.split('.');
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : 'jpg';
  const rawBase = parts.join('.');
  const cleanBase = rawBase.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || 'upload';
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const cleanPrefix = prefix ? `${prefix.replace(/\/+$/, '')}/` : '';
  return `${cleanPrefix}${timestamp}_${randomSuffix}_${cleanBase}.${ext}`;
}

export interface UploadProgressHandler {
  onProgress?: (percent: number) => void;
  onError?: (err: Error) => void;
  onSuccess?: (downloadUrl: string) => void;
}

export interface UploadTask {
  cancel: () => void;
}

export interface UploadFileReturn {
  task: UploadTask | null;
  promise: Promise<string>;
}

/**
 * Downscales an image client-side if either width or height exceeds 2048px.
 * Preserves aspect ratio, compresses to image/jpeg at 0.85 quality.
 * Executes only in supported browser environments; falls back to original file on any error.
 *
 * @param file - The input image File to potentially downscale.
 * @returns A Promise resolving to the downscaled JPEG File, or the original File if already <=2048px or unsupported.
 */
export async function downscaleImageIfLarge(file: File): Promise<File> {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof HTMLCanvasElement === 'undefined' ||
    typeof Image === 'undefined'
  ) {
    return file;
  }

  // Only downscale standard raster image types
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return file;
  }

  return new Promise<File>((resolve) => {
    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(file);
    } catch {
      return resolve(file);
    }

    const img = new Image();

    const cleanup = () => {
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // Ignore revocation failure
        }
      }
    };

    img.onload = () => {
      try {
        const { width, height } = img;
        if (width <= 2048 && height <= 2048) {
          cleanup();
          return resolve(file);
        }

        const scale = 2048 / Math.max(width, height);
        const targetWidth = Math.max(1, Math.round(width * scale));
        const targetHeight = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          return resolve(file);
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (blob) => {
            cleanup();
            if (!blob) {
              return resolve(file);
            }
            const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const downscaledFile = new File([blob], cleanName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(downscaledFile);
          },
          'image/jpeg',
          0.85
        );
      } catch (err) {
        cleanup();
        console.warn('[storageService:downscaleImageIfLarge] Canvas processing failed, using original file:', err);
        resolve(file);
      }
    };

    img.onerror = () => {
      cleanup();
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Uploads an image file to Supabase Storage with client-side validation, 8s timeout,
 * and optional canvas-based downscaling for images over 2048px.
 *
 * @param storagePath - Destination path inside the GS-ARENA bucket.
 * @param file - The image file to validate, downscale if large, and upload.
 * @param handlers - Optional progress and lifecycle callbacks.
 * @returns An object containing a cancelable task handle and the download URL promise.
 */
export function uploadFile(
  storagePath: string,
  file: File,
  handlers?: UploadProgressHandler
): UploadFileReturn {
  // 1. Client-side validation before any request or async operation
  const validation = validateImageFile(file);
  if (!validation.valid) {
    const valErr = new Error(validation.error || 'Invalid file');
    handlers?.onError?.(valErr);
    return {
      task: { cancel: () => {} },
      promise: Promise.reject(valErr),
    };
  }

  // 2. Strict bucket verification
  if (SUPABASE_BUCKET_NAME !== 'GS-ARENA') {
    const bucketErr = new Error(
      `Invalid Supabase storage bucket name "${SUPABASE_BUCKET_NAME}". Expected "GS-ARENA".`
    );
    handlers?.onError?.(bucketErr);
    return {
      task: { cancel: () => {} },
      promise: Promise.reject(bucketErr),
    };
  }

  if (!isSupabaseConfigured()) {
    const cfgErr = new Error(
      'Supabase Storage is not configured. Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.'
    );
    console.error('[storageService:uploadFile]', {
      bucket: SUPABASE_BUCKET_NAME,
      path: storagePath,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      errorMessage: cfgErr.message,
    });
    handlers?.onError?.(cfgErr);
    return {
      task: { cancel: () => {} },
      promise: Promise.reject(cfgErr),
    };
  }

  const cleanPath = storagePath.replace(/^\/+/, '');
  handlers?.onProgress?.(10);

  let timedOut = false;
  let settled = false;
  let timeoutTimer: NodeJS.Timeout | null = null;

  const promise = new Promise<string>((resolve, reject) => {
    // 8-second timeout inside the storage service
    timeoutTimer = setTimeout(() => {
      if (settled) return;
      timedOut = true;
      settled = true;
      const timeoutErr = new TimeoutError(
        'Supabase image upload timed out after 8s. The UI stopped waiting, but the upload was not cancelled by the storage client.',
        8000,
        'uploadFile'
      );
      console.warn('[storageService:uploadFile] Upload timed out after 8s:', {
        bucket: SUPABASE_BUCKET_NAME,
        path: cleanPath,
        fileName: file.name,
      });
      handlers?.onError?.(timeoutErr);
      reject(timeoutErr);
    }, 8000);

    (async () => {
      try {
        // Optional client-side downscale for large images (>2048px on either dimension)
        const fileToUpload = await downscaleImageIfLarge(file);

        if (timedOut) return;
        handlers?.onProgress?.(30);

        // Perform Supabase Storage upload
        const { data, error: uploadError } = await supabase.storage
          .from(SUPABASE_BUCKET_NAME)
          .upload(cleanPath, fileToUpload, {
            contentType: fileToUpload.type,
            upsert: true,
          });

        if (uploadError) {
          if (timedOut) return;
          if (timeoutTimer) clearTimeout(timeoutTimer);
          settled = true;

          const errorObj = new Error(uploadError.message);
          console.error('[storageService:uploadFile] Supabase error:', {
            bucket: SUPABASE_BUCKET_NAME,
            path: cleanPath,
            fileName: fileToUpload.name,
            errorMessage: uploadError.message,
          });

          handlers?.onError?.(errorObj);
          reject(errorObj);
          return;
        }

        if (timedOut) return;
        handlers?.onProgress?.(80);

        // Retrieve public URL from bucket
        const { data: urlData } = supabase.storage
          .from(SUPABASE_BUCKET_NAME)
          .getPublicUrl(data.path);

        const downloadUrl = urlData.publicUrl;

        if (timedOut) return;
        if (timeoutTimer) clearTimeout(timeoutTimer);
        settled = true;

        handlers?.onProgress?.(100);
        handlers?.onSuccess?.(downloadUrl);
        resolve(downloadUrl);
      } catch (err: unknown) {
        if (timedOut) return;
        if (timeoutTimer) clearTimeout(timeoutTimer);
        settled = true;

        const errorObj = err instanceof Error ? err : new Error(String(err));
        console.error('[storageService:uploadFile] Upload exception:', {
          bucket: SUPABASE_BUCKET_NAME,
          path: cleanPath,
          fileName: file.name,
          errorMessage: errorObj.message,
        });

        handlers?.onError?.(errorObj);
        reject(errorObj);
      }
    })();
  });

  return {
    task: {
      cancel: () => {
        timedOut = true;
        settled = true;
        if (timeoutTimer) clearTimeout(timeoutTimer);
      },
    },
    promise,
  };
}

/**
 * Convenience wrapper for uploading files to a specified folder in GS-ARENA bucket.
 *
 * @param file - Image file to upload.
 * @param folder - Destination folder (defaults to 'uploads').
 * @param onProgress - Optional upload progress callback.
 * @returns Promise resolving to the public CDN URL.
 */
export async function uploadStorageFile(
  file: File,
  folder: string = 'uploads',
  onProgress?: (percent: number) => void
): Promise<string> {
  const sanitized = sanitizeStorageFilename(file.name, folder);
  const { promise } = uploadFile(sanitized, file, { onProgress });
  return await promise;
}

/**
 * Deletes a file from the GS-ARENA Supabase Storage bucket by relative path or full URL.
 *
 * @param storagePathOrUrl - The relative bucket path or full HTTPS URL of the file to remove.
 */
export async function deleteStorageFile(storagePathOrUrl: string): Promise<void> {
  if (!isSupabaseConfigured() || !storagePathOrUrl) return;

  try {
    let relativePath = storagePathOrUrl;
    // If it's a full public URL, extract path after bucket name
    if (storagePathOrUrl.startsWith('http')) {
      const match = storagePathOrUrl.match(new RegExp(`/${SUPABASE_BUCKET_NAME}/(.*)$`));
      if (match && match[1]) {
        relativePath = decodeURIComponent(match[1]);
      } else {
        const urlObj = new URL(storagePathOrUrl);
        const segments = urlObj.pathname.split('/');
        const bIdx = segments.indexOf(SUPABASE_BUCKET_NAME);
        if (bIdx !== -1) {
          relativePath = segments.slice(bIdx + 1).join('/');
        }
      }
    }

    const cleanPath = relativePath.replace(/^\/+/, '');
    const { error } = await supabase.storage.from(SUPABASE_BUCKET_NAME).remove([cleanPath]);
    if (error) {
      console.warn('[storageService:deleteStorageFile] Failed to delete file:', error.message);
    }
  } catch (err: unknown) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    console.warn('[storageService:deleteStorageFile] Exception deleting file:', errorObj.message);
  }
}
