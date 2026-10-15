import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { RegistrationWizard } from '../components/registration/RegistrationWizard';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { TagChip } from '../components/ui/TagChip';
import { CornerCaption } from '../components/ui/CornerCaption';

/**
 * Public Roster Registration Page.
 * Broadcast Noir aesthetic with transparent glass container over the global WebGL ribbon.
 */
export function PublicRegistrationPage() {
  return (
    <div className="relative min-h-screen text-foreground flex flex-col justify-between overflow-x-hidden">
      {/* Pinned Corner Caption */}
      <CornerCaption position="top-right">
        CIRCUIT ENTRY // VERIFIED ROSTER
      </CornerCaption>

      {/* Header */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-border bg-surface/75 backdrop-blur-xl sticky top-0">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-mono font-bold text-sm">
            GS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm sm:text-base font-bold tracking-tight text-foreground uppercase">
                GS ARENA
              </span>
              <TagChip variant="accent">ENTRY</TagChip>
            </div>
            <span className="text-[10px] text-muted font-mono tracking-widest block uppercase">
              Official Tournament Roster Registration
            </span>
          </div>
        </Link>

        <Link
          to="/"
          className="font-mono text-xs text-muted hover:text-foreground flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg border border-border bg-surface-2/60 hover:bg-surface-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Leaderboard</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center my-4">
        <ErrorBoundary fallbackTitle="Registration Form Unavailable">
          <RegistrationWizard />
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full py-4 px-6 border-t border-border text-center font-mono text-[11px] text-muted bg-surface/60 backdrop-blur-md">
        © 2026 GS ARENA • OFFICIAL ESPORTS TOURNAMENT CIRCUIT • SINGLE-STEP VERIFICATION
      </footer>
    </div>
  );
}
