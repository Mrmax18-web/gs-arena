import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type {
  Tournament,
  Team,
  Member,
  Match,
  Registration,
  Game,
} from '../types';
import type { RegistrationFilters } from '../lib/firestore';
import {
  getLocalRegistrationsList,
  getDeletedRegistrationIds,
  saveAllLocalRegistrations,
} from '../lib/firestore';

export interface UseQueryResult<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

// ==========================================
// useTournaments
// ==========================================
export function useTournaments(game?: Game): UseQueryResult<Tournament[]> {
  const [data, setData] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const tournamentsRef = collection(db, 'tournaments');
    const constraints: QueryConstraint[] = [];
    if (game) {
      constraints.push(where('game', '==', game));
    }
    const q = query(tournamentsRef, ...constraints);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Tournament[];
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.warn('useTournaments listener notice:', err.message);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [game]);

  return { data, loading, error };
}

// ==========================================
// useTournament
// ==========================================
export function useTournament(
  tournamentId: string | undefined
): UseQueryResult<Tournament | null> {
  const [data, setData] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(tournamentId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tournamentId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const docRef = doc(db, 'tournaments', tournamentId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setData(null);
        } else {
          setData({
            id: snapshot.id,
            ...snapshot.data(),
          } as Tournament);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('useTournament listener notice:', err.message);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [tournamentId]);

  return { data, loading, error };
}

// ==========================================
// useTeams (NO DEMO DATA - REAL FIRESTORE ONLY)
// ==========================================
export function useTeams(
  tournamentId: string | undefined
): UseQueryResult<Team[]> {
  const [data, setData] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(tournamentId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tournamentId) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const teamsRef = collection(db, 'tournaments', tournamentId, 'teams');
    const unsubscribe = onSnapshot(
      teamsRef,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Team[];
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.warn('useTeams listener notice:', err.message);
        setError(err);
        setData([]);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [tournamentId]);

  return { data, loading, error };
}

// ==========================================
// useMembers
// ==========================================
export function useMembers(
  tournamentId: string | undefined,
  teamId: string | undefined
): UseQueryResult<Member[]> {
  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(tournamentId && teamId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tournamentId || !teamId) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const membersRef = collection(
      db,
      'tournaments',
      tournamentId,
      'teams',
      teamId,
      'members'
    );
    const unsubscribe = onSnapshot(
      membersRef,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Member[];
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.warn('useMembers listener notice:', err.message);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [tournamentId, teamId]);

  return { data, loading, error };
}

// ==========================================
// useMatches (NO DEMO DATA - REAL FIRESTORE ONLY)
// ==========================================
export function useMatches(
  tournamentId: string | undefined
): UseQueryResult<Match[]> {
  const [data, setData] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(tournamentId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tournamentId) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const matchesRef = collection(db, 'tournaments', tournamentId, 'matches');
    const unsubscribe = onSnapshot(
      matchesRef,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Match[];
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.warn('useMatches listener notice:', err.message);
        setError(err);
        setData([]);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [tournamentId]);

  return { data, loading, error };
}

// ==========================================
// useRegistrations
// ==========================================
export function useRegistrations(
  filters?: RegistrationFilters
): UseQueryResult<Registration[]> {
  const [data, setData] = useState<Registration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const filterKey = JSON.stringify(filters || {});

  const filterItems = (items: Registration[]) => {
    const deletedIds = getDeletedRegistrationIds();
    return items.filter((r) => {
      if (deletedIds.has(r.id)) return false;
      if (filters?.game && r.game !== filters.game) return false;
      if (filters?.mode && r.mode !== filters.mode) return false;
      if (filters?.tournamentId && r.tournamentId !== filters.tournamentId) return false;
      if (filters?.status && r.status !== filters.status) return false;
      if (filters?.paymentStatus && r.paymentStatus !== filters.paymentStatus) return false;
      return true;
    });
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Initial load from local cache so UI is instantaneous
    const local = getLocalRegistrationsList();
    if (local.length > 0) {
      setData(filterItems(local));
      setLoading(false);
    }

    // Listen to local update events
    const handleLocalUpdate = () => {
      const freshLocal = getLocalRegistrationsList();
      setData(filterItems(freshLocal));
    };
    window.addEventListener('ttp_registrations_updated', handleLocalUpdate);

    const regRef = collection(db, 'registrations');
    const constraints: QueryConstraint[] = [];
    if (filters?.game) {
      constraints.push(where('game', '==', filters.game));
    }
    if (filters?.mode) {
      constraints.push(where('mode', '==', filters.mode));
    }
    if (filters?.tournamentId) {
      constraints.push(where('tournamentId', '==', filters.tournamentId));
    }
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters?.paymentStatus) {
      constraints.push(where('paymentStatus', '==', filters.paymentStatus));
    }
    const q = query(regRef, ...constraints);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const remoteItems = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Registration[];

        const deletedIds = getDeletedRegistrationIds();
        const localItems = getLocalRegistrationsList();
        const localMap = new Map<string, Registration>(localItems.map((r) => [r.id, r]));

        const combinedMap = new Map<string, Registration>();

        remoteItems.forEach((remote) => {
          if (deletedIds.has(remote.id)) return;
          const local = localMap.get(remote.id);
          if (local) {
            const localTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
            const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
            // If local was updated more recently or has status change, preserve local
            if (localTime >= remoteTime) {
              combinedMap.set(remote.id, { ...remote, ...local });
            } else {
              combinedMap.set(remote.id, remote);
            }
          } else {
            combinedMap.set(remote.id, remote);
          }
        });

        localItems.forEach((local) => {
          if (deletedIds.has(local.id)) return;
          if (!combinedMap.has(local.id)) {
            combinedMap.set(local.id, local);
          }
        });

        const mergedList = Array.from(combinedMap.values());
        saveAllLocalRegistrations(mergedList);
        setData(filterItems(mergedList));
        setLoading(false);
      },
      (err) => {
        console.warn('useRegistrations listener notice:', err.message);
        const freshLocal = getLocalRegistrationsList();
        setData(filterItems(freshLocal));
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      window.removeEventListener('ttp_registrations_updated', handleLocalUpdate);
    };
  }, [filterKey]);

  return { data, loading, error };
}

