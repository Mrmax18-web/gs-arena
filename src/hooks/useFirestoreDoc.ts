import { useState, useEffect } from 'react';
import { doc, onSnapshot, FirestoreDataConverter, DocumentReference, DocumentData } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';

export interface UseFirestoreDocResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useFirestoreDoc<T>(
  path: string,
  converter?: FirestoreDataConverter<T>
): UseFirestoreDocResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path || !isFirebaseConfigured() || !db) {
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const docRef: DocumentReference<T | DocumentData, DocumentData> = converter
        ? doc(db, path).withConverter(converter)
        : doc(db, path);

      const unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            setData(snap.data() as T);
          } else {
            setData(null);
          }
          setLoading(false);
        },
        (err) => {
          console.warn(`Firestore doc error on ${path}:`, err);
          setError(err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.warn(`Exception setting up doc listener for ${path}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  }, [path]);

  return { data, loading, error };
}
