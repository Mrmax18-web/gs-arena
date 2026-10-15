import React from 'react';
import { Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export function EmptyPodium() {
  const { user, isAdmin, signIn } = useAuth();

  return (
    <div className="w-full py-2 sm:py-3 px-2 flex flex-col items-center select-none shrink-0">
      <div
        style={{ perspective: '1200px' }}
        className="w-full max-w-2xl grid grid-cols-3 gap-2 sm:gap-4 items-end justify-center min-h-[160px] sm:min-h-[190px]"
      >
        {/* 2nd Place Placeholder (Left) */}
        <div className="flex flex-col items-center w-full opacity-60">
          <div className="flex flex-col items-center mb-1.5 text-center">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs text-slate-400 font-bold mb-1">
              ?
            </div>
            <span className="text-xs text-slate-300 font-mono">Awaiting 2nd</span>
          </div>
          <div
            style={{ transform: 'rotateX(8deg)', transformOrigin: 'bottom center' }}
            className="w-full h-[90px] sm:h-[110px] rounded-t-xl bg-white/[0.03] border-t-2 border-white/20 border-x border-white/5 flex flex-col items-center justify-between p-2 shadow-inner"
          >
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-500 mt-1">
              ?
            </div>
            <div className="w-6 h-0.5 rounded-full bg-white/10 mb-1" />
          </div>
        </div>

        {/* 1st Place Placeholder (Center) */}
        <div className="flex flex-col items-center w-full z-10 opacity-80">
          <div className="flex flex-col items-center mb-1.5 text-center">
            <div className="text-slate-400 mb-0.5 filter grayscale">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center text-sm text-slate-300 font-black mb-1">
              ?
            </div>
            <span className="text-xs font-bold text-slate-300 font-['Teko',sans-serif] tracking-wider uppercase">
              Awaiting Champion
            </span>
          </div>
          <div
            style={{ transform: 'rotateX(8deg)', transformOrigin: 'bottom center' }}
            className="w-full h-[120px] sm:h-[145px] rounded-t-xl bg-white/[0.05] border-t-2 border-white/30 border-x border-white/10 flex flex-col items-center justify-between p-2 shadow-inner"
          >
            <div className="text-3xl sm:text-4xl font-black font-mono text-slate-400 mt-1">
              ?
            </div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                1ST PLACE
              </span>
            </div>
          </div>
        </div>

        {/* 3rd Place Placeholder (Right) */}
        <div className="flex flex-col items-center w-full opacity-60">
          <div className="flex flex-col items-center mb-1.5 text-center">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs text-slate-400 font-bold mb-1">
              ?
            </div>
            <span className="text-xs text-slate-300 font-mono">Awaiting 3rd</span>
          </div>
          <div
            style={{ transform: 'rotateX(8deg)', transformOrigin: 'bottom center' }}
            className="w-full h-[70px] sm:h-[85px] rounded-t-xl bg-white/[0.02] border-t-2 border-white/15 border-x border-white/5 flex flex-col items-center justify-between p-2 shadow-inner"
          >
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-500 mt-1">
              ?
            </div>
            <div className="w-6 h-0.5 rounded-full bg-white/10 mb-1" />
          </div>
        </div>
      </div>

      {/* Message and CTA below */}
      <div className="mt-2 text-center flex flex-col sm:flex-row items-center justify-center gap-2">
        <span className="text-xs text-slate-300">No teams registered yet.</span>
        {!user ? (
          <button
            type="button"
            onClick={() => signIn()}
            className="text-xs text-amber-300 hover:text-amber-200 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
          >
            Sign in as admin to add teams
          </button>
        ) : !isAdmin ? (
          <Link
            to="/register"
            className="text-xs text-orange-400 hover:text-orange-300 font-semibold underline underline-offset-2 transition-colors"
          >
            Register your squad to join
          </Link>
        ) : (
          <Link
            to="/registration"
            className="text-xs text-orange-400 hover:text-orange-300 font-semibold underline underline-offset-2 transition-colors"
          >
            Add or import squads in Registration Management
          </Link>
        )}
      </div>
    </div>
  );
}
