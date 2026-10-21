import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Icon } from '@iconify/react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[75vh] items-center justify-center p-4">
      <GlassCard strong className="max-w-md w-full text-center p-8 md:p-10 shadow-2xl border-slate-200 dark:border-white/10">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-500/10 text-brand-500 border border-brand-500/20 shadow-lg">
          <Icon icon="solar:compass-bold" className="text-4xl" />
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/30">
          Error 404
        </span>

        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-3">
          Zone Out of Bounds
        </h2>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          The tactical map or document you are attempting to reach does not exist or has been relocated outside the playzone.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            icon="solar:cup-star-bold"
            onClick={() => navigate('/leaderboard')}
            className="w-full sm:w-auto"
          >
            Leaderboard
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

export default NotFoundPage;

