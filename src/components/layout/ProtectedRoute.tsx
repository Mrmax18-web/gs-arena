import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '@iconify/react';
import { GlassCard } from '../ui/GlassCard';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <GlassCard className="flex flex-col items-center gap-3 p-8">
          <Icon icon="solar:refresh-circle-bold" className="animate-spin text-3xl text-brand-500" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Authenticating...</p>
        </GlassCard>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
