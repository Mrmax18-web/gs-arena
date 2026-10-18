import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Icon } from '@iconify/react';

interface RegistrationSuccessProps {
  teamName?: string;
  leaderEmail?: string;
  tournamentName?: string;
}

export const RegistrationSuccess: React.FC<RegistrationSuccessProps> = ({
  teamName,
  leaderEmail,
  tournamentName,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <GlassCard strong className="max-w-lg w-full text-center p-8 md:p-10 border-emerald-500/30 shadow-2xl">
        {/* Animated Check Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
          <Icon icon="solar:check-circle-bold" className="text-5xl" />
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          Application Received
        </span>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-3">
          Thanks for registering!
        </h2>

        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          Your application is pending approval. An email will be sent to the Team Leader once approved.
        </p>

        {/* Details Box */}
        {(teamName || leaderEmail) && (
          <div className="mt-6 text-left rounded-2xl bg-black/5 dark:bg-black/30 border border-slate-200 dark:border-white/10 p-4 space-y-2 text-xs">
            {tournamentName && (
              <div className="flex justify-between">
                <span className="text-slate-400">Tournament:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{tournamentName}</span>
              </div>
            )}
            {teamName && (
              <div className="flex justify-between">
                <span className="text-slate-400">Team Name:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{teamName}</span>
              </div>
            )}
            {leaderEmail && (
              <div className="flex justify-between">
                <span className="text-slate-400">Leader Email:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{leaderEmail}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            icon="solar:cup-star-bold"
            onClick={() => navigate('/leaderboard')}
            className="w-full sm:w-auto"
          >
            Go to Leaderboard
          </Button>
          <Button
            variant="glass"
            icon="solar:home-2-bold"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto"
          >
            Game Select
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};
