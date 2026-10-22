import { describe, it, expect, vi } from 'vitest';
import { withTimeout, TimeoutError } from '../lib/timeout';

describe('withTimeout helper', () => {
  it('resolves value when promise settles before timeout', async () => {
    const fastPromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('success'), 10);
    });

    const result = await withTimeout(fastPromise, 100, 'fastOp');
    expect(result).toBe('success');
  });

  it('rejects with original error when promise rejects before timeout', async () => {
    const failingPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('Database write rejected')), 10);
    });

    await expect(withTimeout(failingPromise, 100, 'failingOp')).rejects.toThrow('Database write rejected');
  });

  it('throws TimeoutError when operation exceeds threshold', async () => {
    const hangingPromise = new Promise<string>(() => {
      // never resolves
    });

    await expect(withTimeout(hangingPromise, 25, 'hangOp')).rejects.toThrow(TimeoutError);
    await expect(withTimeout(hangingPromise, 25, 'hangOp')).rejects.toThrow('Operation "hangOp" timed out after 25ms');
  });

  it('clears timer when promise settles early', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const fastPromise = Promise.resolve('instant');

    const result = await withTimeout(fastPromise, 500, 'instantOp');
    expect(result).toBe('instant');
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('swallows late rejection after timeout without unhandled promise rejection', async () => {
    let lateReject: ((err: Error) => void) | null = null;
    const delayedPromise = new Promise<string>((_, reject) => {
      lateReject = reject;
    });

    // Operation times out at 20ms
    await expect(withTimeout(delayedPromise, 20, 'lateRejectOp')).rejects.toThrow(TimeoutError);

    // Simulate late rejection after timeout already fired
    expect(() => {
      if (lateReject) {
        lateReject(new Error('Late network failure'));
      }
    }).not.toThrow();

    // Allow event loop ticks for unhandled rejections to surface if any
    await new Promise((resolve) => setTimeout(resolve, 30));
  });

  it('swallows late resolution after timeout', async () => {
    let lateResolve: ((val: string) => void) | null = null;
    const delayedPromise = new Promise<string>((resolve) => {
      lateResolve = resolve;
    });

    await expect(withTimeout(delayedPromise, 20, 'lateResolveOp')).rejects.toThrow(TimeoutError);

    expect(() => {
      if (lateResolve) {
        lateResolve('Late network payload');
      }
    }).not.toThrow();

    await new Promise((resolve) => setTimeout(resolve, 30));
  });
});
