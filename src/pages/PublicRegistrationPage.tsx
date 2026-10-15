import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowLeft } from 'lucide-react';
import { CosmicBackground } from '../components/CosmicBackground';
import { RegistrationWizard } from '../components/registration/RegistrationWizard';
import { ErrorBoundary } from '../components/ErrorBoundary';

export function PublicRegistrationPage() {
  return (
    <div className="relative min-h-screen bg-[#03040a] text-white flex flex-col justify-between overflow-x-hidden">
      <CosmicBackground />

      {/* Header */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-4 flex items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative shrink-0">
            <img
              src="/gs-arena-logo.png"
              alt="GS Arena"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
                const fb = (e.target as HTMLElement).parentElement?.querySelector('.reg-logo-fb') as HTMLElement;
                if (fb) fb.style.display = 'flex';
              }}
              className="w-10 h-10 rounded-xl object-contain bg-black/60 p-1 border border-orange-500/30 group-hover:scale-105 transition-transform"
            />
            <div className="reg-logo-fb hidden w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-500 items-center justify-center text-white font-black text-xs font-['Teko',sans-serif] text-base">
              GS
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-['Teko',sans-serif] tracking-wider leading-none block text-white uppercase bg-gradient-to-r from-white via-orange-100 to-amber-200 bg-clip-text text-transparent">
              GS ARENA
            </h1>
            <span className="text-xs text-amber-400 font-mono tracking-widest block uppercase">
              Official Registration Portal
            </span>
          </div>
        </Link>

        <Link
          to="/"
          className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors font-medium bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Back to Leaderboard</span>
          <span className="sm:hidden">Leaderboard</span>
        </Link>
      </header>

      {/* Main Content Area with ErrorBoundary */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center my-2">
        <ErrorBoundary fallbackTitle="Registration Form Unavailable">
          <RegistrationWizard />
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full py-4 px-6 border-t border-white/10 text-center text-xs text-slate-400 bg-black/40 backdrop-blur-sm">
        © 2026 GS Arena. Official Tournament Circuit. Single-step verification enabled.
      </footer>
    </div>
  );
}
