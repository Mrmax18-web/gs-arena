import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useRealtimeTournamentAlerts } from '../hooks/useRealtimeTournamentAlerts';
import type { Game, Tournament } from '../types';

export interface TournamentContextType {
  tournaments: Tournament[];
  activeTournament: Tournament | null;
  setActiveTournament: (tournament: Tournament | null) => void;
  loading: boolean;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export interface TournamentProviderProps {
  game: Game;
  children: ReactNode;
}

export function TournamentProvider({ game, children }: TournamentProviderProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Real-time toast alerts for match and bracket updates
  useRealtimeTournamentAlerts(activeTournament?.id);

  useEffect(() => {
    setLoading(true);
    try {
      const tournamentsRef = collection(db, 'tournaments');
      const q = query(tournamentsRef, where('game', '==', game));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: Tournament[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            list.push({
              id: doc.id,
              game: (data.game as Game) || game,
              name: data.name || 'Untitled Tournament',
              startDate: data.startDate || '',
              endDate: data.endDate || '',
              numMatches: data.numMatches ?? 0,
              status: data.status || 'Open',
              mode: data.mode || 'BR',
              cs_group_count: data.cs_group_count,
              cs_teams_per_group: data.cs_teams_per_group,
              cs_rounds_per_match: data.cs_rounds_per_match,
              cs_win_threshold: data.cs_win_threshold,
              cs_matchmaking_seed: data.cs_matchmaking_seed,
              cs_bracket_locked: data.cs_bracket_locked,
              cs_map_pool: data.cs_map_pool,
              bannerUrl: data.bannerUrl,
              createdAt: data.createdAt || new Date().toISOString(),
            });
          });

          setTournaments(list);
          if (list.length > 0) {
            setActiveTournament((prev) => {
              if (prev && list.some((t) => t.id === prev.id)) {
                return list.find((t) => t.id === prev.id) || null;
              }
              return list[0];
            });
          } else {
            // Default active container id for initial tournament context if collection is empty
            setActiveTournament({
              id: `${game.toLowerCase().replace(/\s+/g, '-')}-championship-s1`,
              game,
              name: `${game} Championship`,
              startDate: '',
              endDate: '',
              numMatches: 0,
              status: 'Open',
              mode: game === 'Free Fire' ? 'CS' : 'BR',
              createdAt: new Date().toISOString(),
            });
          }
          setLoading(false);
        },
        (err) => {
          console.warn('Tournament listener notice:', err.message);
          // Fallback container when Firestore is offline/unreachable
          setActiveTournament({
            id: `${game.toLowerCase().replace(/\s+/g, '-')}-championship-s1`,
            game,
            name: `${game} Championship`,
            startDate: '',
            endDate: '',
            numMatches: 0,
            status: 'Open',
            mode: game === 'Free Fire' ? 'CS' : 'BR',
            createdAt: new Date().toISOString(),
          });
          setTournaments([]);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch {
      setLoading(false);
    }
  }, [game]);

  const value: TournamentContextType = {
    tournaments,
    activeTournament,
    setActiveTournament,
    loading,
  };

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournament(): TournamentContextType {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
}
