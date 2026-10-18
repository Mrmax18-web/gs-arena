import { supabase } from '../lib/supabase';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const BUCKET_NAME = 'GS-ARENA';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): FileValidationResult {
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

export interface UploadProgressHandler {
  onProgress?: (percent: number) => void;
  onError?: (err: Error) => void;
  onSuccess?: (downloadUrl: string) => void;
}

export function uploadFile(
  storagePath: string,
  file: File,
  handlers?: UploadProgressHandler
): { promise: Promise<string> } {
  const promise = (async (): Promise<string> => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      handlers?.onProgress?.(10);

      // Clean the path (remove leading slash if present)
      const cleanPath = storagePath.startsWith('/') ? storagePath.slice(1) : storagePath;

      handlers?.onProgress?.(50);

      // Upload to Supabase
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(cleanPath, file, {
          cacheControl: '3600',
          upsert: true, // Overwrite if file with same name exists
          contentType: file.type,
        });

      if (error) throw error;

      handlers?.onProgress?.(90);

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(cleanPath);

      handlers?.onProgress?.(100);
      handlers?.onSuccess?.(publicUrlData.publicUrl);

      return publicUrlData.publicUrl;
    } catch (err: any) {
      handlers?.onError?.(err);
      throw err;
    }
  })();

  return { promise };
}

export async function deleteStorageFile(storagePathOrUrl: string): Promise<void> {
  try {
    // If it's a full URL, extract just the file path part
    let cleanPath = storagePathOrUrl;
    if (cleanPath.includes(`${BUCKET_NAME}/`)) {
      cleanPath = cleanPath.split(`${BUCKET_NAME}/`)[1];
    }
    
    // Remove any URL query parameters
    cleanPath = cleanPath.split('?')[0];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([cleanPath]);

    if (error) {
      console.warn('Failed to delete Supabase storage file:', error);
    }
  } catch (err) {
    console.warn('Failed to delete storage file:', err);
  }
}