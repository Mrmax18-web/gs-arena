/**
 * Custom error thrown when an asynchronous operation exceeds its allocated timeout threshold.
 */
export class TimeoutError extends Error {
  public readonly label?: string;
  public readonly ms: number;

  constructor(message: string, ms: number, label?: string) {
    super(message);
    this.name = 'TimeoutError';
    this.ms = ms;
    this.label = label;
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Wraps an asynchronous Promise with a strict timeout threshold.
 * Automatically clears the active timer as soon as the promise settles.
 * If the timeout triggers prior to settlement, rejects with TimeoutError and
 * catches subsequent settlement of the wrapped promise to prevent unhandled rejections.
 *
 * @param promise - The promise to await.
 * @param ms - Timeout threshold in milliseconds.
 * @param label - Optional descriptor for error logging and identification.
 * @returns The resolved value of the wrapped promise.
 * @throws TimeoutError if the promise does not settle within ms milliseconds.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label?: string
): Promise<T> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let hasTimedOut = false;

  // Attach a no-op catch handler to swallow late rejections if the wrapped promise
  // rejects after this wrapper has already timed out.
  promise.catch((_lateErr: unknown) => {
    // Intentionally swallowed to avoid unhandled rejections in the runtime
  });

  return new Promise<T>((resolve, reject) => {
    timerId = setTimeout(() => {
      hasTimedOut = true;
      const opName = label ? `Operation "${label}"` : 'Operation';
      reject(new TimeoutError(`${opName} timed out after ${ms}ms`, ms, label));
    }, ms);

    promise.then(
      (val) => {
        if (timerId !== null) {
          clearTimeout(timerId);
          timerId = null;
        }
        if (!hasTimedOut) {
          resolve(val);
        }
      },
      (err: unknown) => {
        if (timerId !== null) {
          clearTimeout(timerId);
          timerId = null;
        }
        if (!hasTimedOut) {
          reject(err);
        }
      }
    );
  });
}
