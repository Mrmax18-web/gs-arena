/**
 * Image Utilities for GS Arena / Tournament Tracker Pro
 * Handles aggressive client-side image compression, canvas resizing, and conversion to base64 Data URLs.
 */

export async function fileToBase64(
  file: File,
  maxDimension = 400,
  quality = 0.6
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Aggressive resize
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));

        // Solid background (for transparent PNGs in dark theme)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        // JPEG at 0.6 quality = ~70% smaller than PNG
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        console.log(
          '[image] Compressed:',
          `original: ${(file.size / 1024).toFixed(0)}KB → ` +
          `compressed: ${(dataUrl.length / 1024).toFixed(0)}KB ` +
          `(${width}x${height})`
        );

        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Limits per image type to keep total document payload well below Firestore limits
export const IMAGE_LIMITS = {
  logo: { maxDimension: 400, quality: 0.7, maxSizeKB: 200 },
  icon: { maxDimension: 300, quality: 0.7, maxSizeKB: 150 },
  favicon: { maxDimension: 128, quality: 0.8, maxSizeKB: 50 },
  background: { maxDimension: 800, quality: 0.5, maxSizeKB: 400 },
} as const;

export type ImageType = keyof typeof IMAGE_LIMITS;

export async function compressImage(
  file: File,
  type: ImageType
): Promise<string> {
  const limits = IMAGE_LIMITS[type] || IMAGE_LIMITS.icon;

  if (file.size > limits.maxSizeKB * 1024 * 4) {
    // Raw file > 4x limit → reject before compressing
    throw new Error(
      `Image too large. Please use a smaller file (under ${
        limits.maxSizeKB * 4
      } KB).`
    );
  }

  return fileToBase64(file, limits.maxDimension, limits.quality);
}

/**
 * Validates .glb and .gltf 3D model files with size limits (up to 5MB for Firestore/base64).
 */
export function validateGlbFile(file: File): { valid: boolean; error?: string } {
  if (!file) return { valid: false, error: 'No file provided' };
  const ext = file.name.toLowerCase().split('.').pop();
  if (ext !== 'glb' && ext !== 'gltf') {
    return { valid: false, error: 'File must end with .glb or .gltf' };
  }
  const maxBytes = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Model file is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Limit is 5 MB.`,
    };
  }
  return { valid: true };
}

/**
 * Reads a .glb or .gltf model File and encodes it to a base64 Data URL.
 */
export async function fileToGlbBase64(file: File): Promise<string> {
  const check = validateGlbFile(file);
  if (!check.valid) {
    throw new Error(check.error || 'Invalid 3D model file');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        console.log(
          `[3d-model] Encoded ${file.name}: ${(file.size / 1024).toFixed(0)} KB → ${(result.length / 1024).toFixed(0)} KB base64`
        );
        resolve(result);
      } else {
        reject(new Error('Failed to encode 3D model to base64'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read 3D model file'));
    reader.readAsDataURL(file);
  });
}
