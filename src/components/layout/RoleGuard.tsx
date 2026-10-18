import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <GlassCard className="flex flex-col items-center gap-3 p-8">
          <Icon icon="solar:refresh-circle-bold" className="animate-spin text-3xl text-brand-500" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Verifying cryptographic credentials...
          </p>
        </GlassCard>
      </div>
    );
  }

  const isAuthorized = allowedRoles.includes(role);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <GlassCard className="max-w-md w-full text-center border-amber-500/30 p-8 shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <Icon icon="solar:lock-keyhole-bold" className="text-3xl" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Restricted Access
          </h2>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {user
              ? `Your account does not possess the required permissions (${allowedRoles.join(' or ')}). Current role: ${role}.`
              : 'You must be signed in with an authorized administrator account to view this console.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => navigate('/leaderboard')}>
              Return to Leaderboard
            </Button>
            {!user && (
              <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            )}
          </div>
        </GlassCard>
      </div>
    );
  }

  return <>{children}</>;
};
