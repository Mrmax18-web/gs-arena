import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const SUPABASE_BUCKET_NAME = 'GS-ARENA';
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

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

export function uploadFile(
  storagePath: string,
  file: File,
  handlers?: UploadProgressHandler
): { task: any; promise: Promise<string> } {
  // 1. Client-side validation before attempting upload
  const validation = validateImageFile(file);
  if (!validation.valid) {
    const valErr = new Error(validation.error || 'Invalid file');
    handlers?.onError?.(valErr);
    return {
      task: null,
      promise: Promise.reject(valErr),
    };
  }

  if (!isSupabaseConfigured()) {
    const cfgErr = new Error(
      'Supabase Storage is not configured. Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.'
    );
    console.error('[Supabase Storage Upload Error]', {
      bucket: SUPABASE_BUCKET_NAME,
      path: storagePath,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      errorMessage: cfgErr.message,
      errorName: cfgErr.name,
      statusCode: 500,
    });
    handlers?.onError?.(cfgErr);
    return {
      task: null,
      promise: Promise.reject(cfgErr),
    };
  }

  // Clean path without leading slash
  const cleanPath = storagePath.replace(/^\/+/, '');

  handlers?.onProgress?.(10);

  const promise = new Promise<string>((resolve, reject) => {
    (async () => {
      try {
        handlers?.onProgress?.(30);

        // Perform Supabase Storage upload
        const { data, error: uploadError } = await supabase.storage
          .from(SUPABASE_BUCKET_NAME)
          .upload(cleanPath, file, {
            contentType: file.type,
            upsert: true,
          });

        if (uploadError) {
          const statusCode =
            (uploadError as any).statusCode ||
            (uploadError as any).status ||
            ((uploadError as any).error === 'Bucket not found' ? 404 : 400);

          console.error('[Supabase Storage Upload Error]', {
            bucket: SUPABASE_BUCKET_NAME,
            path: cleanPath,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            errorMessage: uploadError.message,
            errorName: uploadError.name,
            statusCode,
          });

          const formattedError = new Error(uploadError.message);
          handlers?.onError?.(formattedError);
          reject(formattedError);
          return;
        }

        handlers?.onProgress?.(80);

        // Retrieve public URL from bucket
        const { data: urlData } = supabase.storage
          .from(SUPABASE_BUCKET_NAME)
          .getPublicUrl(data.path);

        const downloadUrl = urlData.publicUrl;
        handlers?.onProgress?.(100);
        handlers?.onSuccess?.(downloadUrl);
        resolve(downloadUrl);
      } catch (err: any) {
        console.error('[Supabase Storage Upload Error]', {
          bucket: SUPABASE_BUCKET_NAME,
          path: cleanPath,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          errorMessage: err?.message || 'Unknown upload exception',
          errorName: err?.name || 'UploadException',
          statusCode: err?.statusCode || 500,
        });

        handlers?.onError?.(err);
        reject(err);
      }
    })();
  });

  return {
    task: {
      cancel: () => {},
    },
    promise,
  };
}

export async function uploadStorageFile(
  file: File,
  folder: string = 'uploads',
  onProgress?: (percent: number) => void
): Promise<string> {
  const sanitized = sanitizeStorageFilename(file.name, folder);
  const { promise } = uploadFile(sanitized, file, { onProgress });
  return await promise;
}

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
      console.warn('Failed to delete Supabase storage file:', error.message);
    }
  } catch (err: any) {
    console.warn('Exception deleting Supabase storage file:', err?.message);
  }
}
