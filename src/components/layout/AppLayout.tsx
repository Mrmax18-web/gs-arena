import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TwistRibbon } from '../backgrounds/TwistRibbon';
import { ErrorBoundary } from './ErrorBoundary';
import { isFirebaseConfigured } from '../../lib/firebase';
import { useGame } from '../../context/GameContext';
import { Icon } from '@iconify/react';
import { useAppearance } from '../../hooks/useAppearance';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { gameId } = useGame();
  const configured = isFirebaseConfigured();
  const { appearance } = useAppearance();
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [appearance.arenaLogoUrl]);

  // If on the root GameSelectPage or public /viewer, omit sidebar
  const isFullScreenPage = location.pathname === '/' || location.pathname === '/viewer';

  return (
    <div className="relative min-h-screen bg-transparent text-slate-100 flex flex-col">
      {/* 1. WebGL Twist Ribbon rendered fixed behind everything at z-0 */}
      <TwistRibbon />

      {/* 2. Top notification banner if Firebase env vars are not configured */}
      {!configured && (
        <div className="relative z-40 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 text-xs shadow-md border-b border-white/20 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon icon="solar:shield-warning-bold" className="text-lg shrink-0 text-amber-200" />
            <span>
              <strong>Firebase Setup Required:</strong> Missing <code className="bg-black/30 px-1 py-0.5 rounded font-mono">VITE_FIREBASE_API_KEY</code> and project configs. Running in local preview mode.
            </span>
          </div>
          <Button
            variant="glass"
            size="sm"
            onClick={() => window.open('https://console.firebase.google.com/', '_blank')}
            className="text-[11px] py-1 px-3 text-white border-white/30"
          >
            Firebase Console
          </Button>
        </div>
      )}

      {/* 3. Mobile Header Bar */}
      {!isFullScreenPage && (
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 glass border-b border-black/10 dark:border-white/10">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Icon icon="solar:hamburger-menu-bold" className="text-2xl" />
          </button>

          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer"
          >
            {appearance.arenaLogoUrl && !logoError ? (
              <img
                src={appearance.arenaLogoUrl}
                alt={appearance.siteName || 'GS Arena'}
                onError={() => setLogoError(true)}
                className="h-7 w-7 object-contain rounded-lg shadow-sm"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-red-600 to-red-700 text-white shadow-sm shadow-red-600/20">
                <Icon icon="solar:cup-star-bold" className="text-sm" />
              </div>
            )}
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
              {appearance.siteName ? (
                appearance.siteName
              ) : (
                <>
                  GS <span className="text-brand-500">ARENA</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30">
              {gameId}
            </span>
          </div>
        </header>
      )}

      <div className="flex-1 flex w-full relative z-10">
        {/* 4. Navigation Sidebar */}
        {!isFullScreenPage && (
          <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        )}

        {/* 5. Main Routed Content */}
        <main
          className={`flex-1 min-h-[calc(100vh-60px)] transition-all duration-300 relative z-10 ${
            !isFullScreenPage ? 'md:pl-[72px]' : ''
          }`}
        >
          <ErrorBoundary>
            <div className="w-full h-full relative z-10">
              <Suspense fallback={<LoadingSpinner label="Loading Arena..." />}>
                <Outlet />
              </Suspense>
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};
