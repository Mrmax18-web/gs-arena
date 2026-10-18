import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask,
} from 'firebase/storage';
import { storage } from '../lib/firebase';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

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
): { task: UploadTask; promise: Promise<string> } {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized.');
  }

  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const storageRef = ref(storage, storagePath);
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  });

  const promise = new Promise<string>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        handlers?.onProgress?.(progress);
      },
      (error) => {
        handlers?.onError?.(error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          handlers?.onSuccess?.(downloadUrl);
          resolve(downloadUrl);
        } catch (err: any) {
          handlers?.onError?.(err);
          reject(err);
        }
      }
    );
  });

  return { task: uploadTask, promise };
}

export async function deleteStorageFile(storagePathOrUrl: string): Promise<void> {
  if (!storage) return;

  try {
    const fileRef = ref(storage, storagePathOrUrl);
    await deleteObject(fileRef);
  } catch (err) {
    // If it's already gone or invalid url, don't throw blocking error
    console.warn('Failed to delete storage file:', err);
  }
}
