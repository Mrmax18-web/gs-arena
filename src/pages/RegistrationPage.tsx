import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { tournamentConverter } from '../lib/converters';
import { Tournament } from '../types/tournament';
import { RegistrationForm } from '../components/registration/RegistrationForm';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { ErrorBoundary } from '../components/layout/ErrorBoundary';
import { limit } from 'firebase/firestore';

export const RegistrationPage: React.FC = () => {
  const { game } = useGame();
  const [searchParams] = useSearchParams();
  const tParam = searchParams.get('t') || undefined;

  const constraints = useMemo(() => [limit(50)], []);
  const {
    data: tournaments,
    loading,
    error,
    refetch,
  } = useFirestoreCollection<Tournament>('tournaments', constraints, tournamentConverter);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 inline-block">
          {game.name}
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Squad Registration
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Enroll your 4-player competitive roster. All applications are reviewed by tournament administrators before room allocation.
        </p>
      </div>

      {loading ? (
        <Skeleton height={400} className="w-full max-w-2xl mx-auto" />
      ) : error ? (
        <ErrorState
          title="Could Not Load Tournaments"
          description={error.message}
          onRetry={refetch}
        />
      ) : (
        <ErrorBoundary fallbackTitle="Registration Form Unavailable">
          <RegistrationForm tournaments={tournaments} defaultTournamentId={tParam} />
        </ErrorBoundary>
      )}
    </div>
  );
};

export default RegistrationPage;


