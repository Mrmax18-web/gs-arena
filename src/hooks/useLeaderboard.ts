import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { matchConverter, teamConverter } from '../lib/converters';
import { AwardWinner, Match, ScoringSnapshot, Team, TournamentStandingsRow } from '../types/tournament';
import { GameId } from '../types/game';
import { computeStandings } from '../lib/scoring';
import { findTournamentMvp, findTournamentTopFragger } from '../lib/awards';

export interface UseLeaderboardOptions {
  tournamentId?: string;
  gameId: GameId;
  scoringSnapshot: ScoringSnapshot;
}

export interface UseLeaderboardResult {
  standings: TournamentStandingsRow[];
  matches: Match[];
  teams: Team[];
  mvp: AwardWinner | null;
  topFragger: AwardWinner | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: string | null;
}

export function useLeaderboard({
  tournamentId,
  gameId,
  scoringSnapshot,
}: UseLeaderboardOptions): UseLeaderboardResult {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    if (!tournamentId || !isFirebaseConfigured() || !db) {
      setMatches([]);
      setTeams([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // 1. Matches listener
    const matchesRef = collection(db, 'tournaments', tournamentId, 'matches').withConverter(
      matchConverter
    );
    const matchesQuery = query(matchesRef, orderBy('matchNumber', 'asc'));

    const unsubMatches = onSnapshot(
      matchesQuery,
      (snapshot) => {
        const items: Match[] = [];
        snapshot.forEach((doc) => {
          if (doc.data()) items.push(doc.data());
        });
        setMatches(items);
        setLastUpdated(new Date().toLocaleTimeString());
        setLoading(false);
      },
      (err) => {
        console.warn('Matches subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    // 2. Teams listener
    const teamsRef = collection(db, 'tournaments', tournamentId, 'teams').withConverter(
      teamConverter
    );

    const unsubTeams = onSnapshot(
      teamsRef,
      (snapshot) => {
        const items: Team[] = [];
        snapshot.forEach((doc) => {
          if (doc.data()) items.push(doc.data());
        });
        setTeams(items);
      },
      (err) => {
        console.warn('Teams subscription error:', err);
      }
    );

    return () => {
      unsubMatches();
      unsubTeams();
    };
  }, [tournamentId]);

  // Compute standings using pure idempotent scoring
  const standings = useMemo(() => {
    if (!tournamentId || (matches || []).length === 0) {
      // If teams are registered but no matches played yet, generate zeroed standings
      if ((teams || []).length > 0) {
        return teams.map((t, idx) => ({
          rank: idx + 1,
          teamId: t?.id ?? `team-${idx}`,
          teamName: t?.teamName ?? 'Registered Team',
          matchesPlayed: 0,
          placementPoints: 0,
          killPoints: 0,
          totalKills: 0,
          totalPoints: 0,
          wwcdCount: 0,
          matchWins: 0,
          roundDifference: 0,
          isLeader: false,
        }));
      }
      return [];
    }

    return computeStandings(gameId, matches, scoringSnapshot);
  }, [tournamentId, matches, teams, gameId, scoringSnapshot]);

  // Compute MVP and Top Fragger across completed matches
  const { mvp, topFragger } = useMemo(() => {
    const completedMatches = (matches || []).filter((m) => m?.status === 'completed');
    if (completedMatches.length === 0) {
      return { mvp: null, topFragger: null };
    }

    const tMvp = findTournamentMvp(completedMatches, scoringSnapshot?.mvpWeights, 'Tournament');
    const tTopFragger = findTournamentTopFragger(completedMatches, 'Tournament');

    return { mvp: tMvp, topFragger: tTopFragger };
  }, [matches, scoringSnapshot]);

  return {
    standings,
    matches,
    teams,
    mvp,
    topFragger,
    loading,
    error,
    lastUpdated,
  };
}
