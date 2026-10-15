/**
 * Converts an image file to a base64 Data URL with a 5MB size limit
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Size check (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Screenshot must be under 5 MB'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not convert file to base64 data'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Removes undefined values from an object before writing to Firestore.
 * Firestore rejects `undefined` — it only accepts null.
 *
 * @example
 *   const clean = stripUndefined({ a: 1, b: undefined, c: null });
 *   // → { a: 1, c: null }
 */
export function stripUndefined<T extends Record<string, any>>(
  obj: T,
): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];
    if (value === undefined) continue;
    if (value === null) {
      result[key] = value;
      continue;
    }
    if (Array.isArray(value)) {
      result[key] = value.map((item: any) =>
        typeof item === 'object' && item !== null
          ? stripUndefined(item as Record<string, any>)
          : item,
      ) as any;
      continue;
    }
    if (typeof value === 'object') {
      result[key] = stripUndefined(value as Record<string, any>) as any;
      continue;
    }
    result[key] = value;
  }
  return result;
}

/**
 * Alternative: converts undefined → null (Firestore accepts null).
 * Use this when you want to explicitly clear a field.
 */
export function undefinedToNull<T extends Record<string, any>>(
  obj: T,
): T {
  const result: any = {};
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];
    if (value === undefined) {
      result[key] = null;
    } else if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      result[key] = undefinedToNull(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
