import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Target, CheckCircle2, ArrowRight } from 'lucide-react';
import type { Mode } from '../../types';

export interface ModeSelectionStepProps {
  onSelectMode: (mode: Mode) => void;
  selectedMode?: Mode;
}

export function ModeSelectionStep({ onSelectMode, selectedMode }: ModeSelectionStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest bg-red-500/20 text-rose-300 border border-red-500/30">
          Step 2 · Select Format
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-white font-['Orbitron',sans-serif] uppercase tracking-tight">
          CHOOSE YOUR FORMAT
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-['Rajdhani',sans-serif] tracking-wider">
          Free Fire offers two competitive formats. Select the format your squad will compete in.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-2">
        {/* CARD 1 — CLASH SQUAD */}
        <motion.div
          whileHover={{ y: -8, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          onClick={() => onSelectMode('CS')}
          className={`relative rounded-2xl overflow-hidden border p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 bg-gradient-to-b from-[#250a0e]/95 via-[#160608]/95 to-[#090203] ${
            selectedMode === 'CS'
              ? 'border-rose-500 shadow-[0_0_30px_rgba(255,45,45,0.35)] ring-2 ring-rose-500/50'
              : 'border-rose-500/30 hover:border-rose-500/70 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
          }`}
        >
          {/* Sci-Fi Corner Accents */}
          <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-rose-500" />
          <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-rose-500" />
          <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-rose-500" />
          <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-rose-500" />

          <div>
            {/* Header / Mode Image */}
            <div className="relative h-40 w-full mb-4 rounded-xl overflow-hidden bg-black/40 border border-rose-500/20 flex items-center justify-center p-4">
              <img
                src="/public/freefire-icon.png"
                alt="Clash Squad Mode"
                onError={(e) => {
                  e.currentTarget.src = '/freefire-icon.png';
                }}
                className="h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,45,45,0.4)]"
              />
              <div className="absolute top-3 right-3 px-2 py-1 rounded bg-rose-500/30 border border-rose-400 text-rose-200 text-[10px] font-mono font-bold uppercase">
                4v4 LEAGUE
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1 text-rose-400">
              <Swords className="w-5 h-5" />
              <span className="text-xs font-mono uppercase tracking-widest text-rose-300">
                TACTICAL KNOCKOUT
              </span>
            </div>

            <h3 className="text-2xl font-black text-white font-['Orbitron',sans-serif] uppercase tracking-tight">
              CLASH SQUAD
            </h3>
            <p className="text-xs text-rose-300/80 font-mono mb-4">4v4 Best-of-7</p>

            <ul className="space-y-2 text-xs text-slate-300 font-['Rajdhani',sans-serif] text-sm mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                <span>4v4 team battles (4 players + 1 sub)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Best of 7 rounds format</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Group stage + double-elimination playoffs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Round-by-round win tracking</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-bold font-['Rajdhani',sans-serif] uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
          >
            <span>SELECT CLASH SQUAD</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* CARD 2 — BATTLE ROYALE */}
        <motion.div
          whileHover={{ y: -8, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          onClick={() => onSelectMode('BR')}
          className={`relative rounded-2xl overflow-hidden border p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 bg-gradient-to-b from-[#26150a]/95 via-[#170c06]/95 to-[#090402] ${
            selectedMode === 'BR'
              ? 'border-orange-500 shadow-[0_0_30px_rgba(255,107,53,0.35)] ring-2 ring-orange-500/50'
              : 'border-orange-500/30 hover:border-orange-500/70 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
          }`}
        >
          {/* Sci-Fi Corner Accents */}
          <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-orange-500" />
          <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-orange-500" />
          <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-orange-500" />
          <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-orange-500" />

          <div>
            {/* Header / Mode Image */}
            <div className="relative h-40 w-full mb-4 rounded-xl overflow-hidden bg-black/40 border border-orange-500/20 flex items-center justify-center p-4">
              <img
                src="/public/freefire-icon.png"
                alt="Battle Royale Mode"
                onError={(e) => {
                  e.currentTarget.src = '/freefire-icon.png';
                }}
                className="h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,107,53,0.4)]"
              />
              <div className="absolute top-3 right-3 px-2 py-1 rounded bg-orange-500/30 border border-orange-400 text-orange-200 text-[10px] font-mono font-bold uppercase">
                12 SQUADS BR
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1 text-orange-400">
              <Target className="w-5 h-5" />
              <span className="text-xs font-mono uppercase tracking-widest text-orange-300">
                LAST MAN STANDING
              </span>
            </div>

            <h3 className="text-2xl font-black text-white font-['Orbitron',sans-serif] uppercase tracking-tight">
              BATTLE ROYALE
            </h3>
            <p className="text-xs text-orange-300/80 font-mono mb-4">Survival Format</p>

            <ul className="space-y-2 text-xs text-slate-300 font-['Rajdhani',sans-serif] text-sm mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                <span>12-16 teams competing per match</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Placement points + kill multipliers</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Multiple match lobby rotation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Booyah / WWCD leaderboards</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-amber-600 text-white font-bold font-['Rajdhani',sans-serif] uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
          >
            <span>SELECT BATTLE ROYALE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
