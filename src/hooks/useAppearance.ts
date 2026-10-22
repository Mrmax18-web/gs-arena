import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { appearanceConfigConverter } from '../lib/converters';
import { AppearanceConfig } from '../types/config';
import { DEFAULT_SYSTEM_CONFIG } from '../lib/constants';

export function useAppearance(): {
  appearance: AppearanceConfig;
  loading: boolean;
  error: Error | null;
} {
  const [appearance, setAppearance] = useState<AppearanceConfig>(
    DEFAULT_SYSTEM_CONFIG.appearance || {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured() || !db) {
      setLoading(false);
      return;
    }

    try {
      const ref = doc(db, 'config', 'appearance').withConverter(appearanceConfigConverter);
      const unsubscribe = onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            console.log("Snapshot received:", data);
            if (data) {
              setAppearance(data);
            }
          }
          setLoading(false);
        },
        (err) => {
          console.warn('[Appearance] onSnapshot error:', err.message);
          setError(err);
          setLoading(false);
        }
      );

      return () => {
        unsubscribe();
      };
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      console.warn('[Appearance] Subscription error:', errorObj.message);
      setError(errorObj);
      setLoading(false);
    }
  }, []);

  return { appearance, loading, error };
}
