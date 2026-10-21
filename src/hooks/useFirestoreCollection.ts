import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  QueryConstraint,
  FirestoreDataConverter,
  Query,
  DocumentData,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';

export interface UseFirestoreCollectionResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseFirestoreCollectionOptions {
  enabled?: boolean;
}

export function useFirestoreCollection<T>(
  collectionPath: string,
  constraints: QueryConstraint[] = [],
  converter?: FirestoreDataConverter<T>,
  options?: UseFirestoreCollectionOptions
): UseFirestoreCollectionResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((t) => t + 1);

  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled || !collectionPath || !isFirebaseConfigured() || !db) {
      setLoading(false);
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const colRef = collection(db, collectionPath);
      const q: Query<T | DocumentData, DocumentData> = converter
        ? query(colRef.withConverter(converter), ...constraints)
        : query(colRef, ...constraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: T[] = [];
          snapshot.forEach((doc) => {
            const item = doc.data() as T;
            if (item) items.push(item);
          });
          console.log("Snapshot received:", items);
          setData(items);
          setLoading(false);
        },
        (err) => {
          console.warn(`Firestore collection error on ${collectionPath}:`, err);
          setError(err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.warn(`Exception setting up listener for ${collectionPath}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  }, [collectionPath, JSON.stringify(constraints.map((c) => c.type)), tick, enabled]);

  return { data, loading, error, refetch };
}
