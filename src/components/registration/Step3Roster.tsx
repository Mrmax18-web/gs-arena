import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Users,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { Game, Mode } from '../../types';

export interface RosterPlayer {
  name: string;
  uid: string;
  ign: string;
  email?: string;
}

export interface Step3RosterProps {
  selectedGame: Game;
  selectedMode: Mode;
  teamName: string;
  teamTag: string;
  captainEmail: string;
  players: RosterPlayer[];
  setPlayers: React.Dispatch<React.SetStateAction<RosterPlayer[]>>;
  onBack: () => void;
  onNext: () => void;
}

export function Step3Roster({
  selectedGame,
  selectedMode,
  teamName,
  teamTag,
  captainEmail,
  players,
  setPlayers,
  onBack,
  onNext,
}: Step3RosterProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePlayerChange = (
    index: number,
    field: keyof RosterPlayer,
    val: string
  ) => {
    setPlayers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
    // Clear specific error
    if (errors[`player_${index}_${field}`] || errors.general) {
      setErrors((prev) => ({
        ...prev,
        [`player_${index}_${field}`]: '',
        general: '',
      }));
    }
  };

  const addSubstitute = () => {
    if (players.length < 5) {
      setPlayers((prev) => [...prev, { name: '', uid: '', ign: '', email: '' }]);
    }
  };

  const removeSubstitute = () => {
    if (players.length > 4) {
      setPlayers((prev) => prev.slice(0, 4));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    const uidSet = new Set<string>();

    // Players 1, 2, 3 are strictly required
    for (let i = 0; i < 3; i++) {
      const p = players[i];
      if (!p.uid?.trim()) {
        errs[`player_${i}_uid`] = `Player ${i + 1} Game UID is required`;
      } else {
        if (uidSet.has(p.uid.trim().toUpperCase())) {
          errs[`player_${i}_uid`] = 'UID must be unique in roster';
        }
        uidSet.add(p.uid.trim().toUpperCase());
      }

      if (!p.ign?.trim()) {
        errs[`player_${i}_ign`] = `Player ${i + 1} IGN is required`;
      }
    }

    // Player 4 is required for BR, optional for CS
    const isPlayer4Required = selectedMode === 'BR' || selectedGame === 'BGMI';
    const p4 = players[3];
    if (isPlayer4Required) {
      if (!p4?.uid?.trim()) {
        errs[`player_3_uid`] = 'Player 4 Game UID is required for Battle Royale';
      } else {
        if (uidSet.has(p4.uid.trim().toUpperCase())) {
          errs[`player_3_uid`] = 'UID must be unique in roster';
        }
        uidSet.add(p4.uid.trim().toUpperCase());
      }
      if (!p4?.ign?.trim()) {
        errs[`player_3_ign`] = 'Player 4 IGN is required';
      }
    } else if (p4?.uid?.trim()) {
      if (uidSet.has(p4.uid.trim().toUpperCase())) {
        errs[`player_3_uid`] = 'UID must be unique in roster';
      }
      uidSet.add(p4.uid.trim().toUpperCase());
    }

    // Substitute (Player 5) validation if present
    if (players.length > 4) {
      const p5 = players[4];
      if (p5.uid?.trim()) {
        if (uidSet.has(p5.uid.trim().toUpperCase())) {
          errs[`player_4_uid`] = 'Substitute UID must be unique in roster';
        }
        uidSet.add(p5.uid.trim().toUpperCase());
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleContinue} className="space-y-6 animate-in fade-in duration-300">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider block">
            Step 3 of 4
          </span>
          <h2 className="text-3xl font-black font-['Teko',sans-serif] uppercase tracking-wide text-white">
            Squad Roster Lineup
          </h2>
        </div>

        {/* Team Tag pill */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 self-start sm:self-auto">
          <span className="text-xs font-semibold text-gray-300">
            Team: <strong className="text-white">{teamName}</strong>
            {teamTag && <span className="text-orange-400 ml-1">[{teamTag}]</span>}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {players.map((player, idx) => {
          const isCaptain = idx === 0;
          const isPlayer4 = idx === 3;
          const isSubstitute = idx === 4;
          const isOptional = isPlayer4 && selectedMode === 'CS';

          return (
            <Card
              key={idx}
              className={`p-4 sm:p-5 border transition-all ${
                isCaptain
                  ? 'border-orange-500/40 bg-orange-500/[0.04]'
                  : isSubstitute
                  ? 'border-amber-500/30 bg-amber-500/[0.03]'
                  : 'border-white/10 bg-black/40'
              }`}
            >
              {/* Card Title */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                      isCaptain
                        ? 'bg-orange-500 text-white'
                        : isSubstitute
                        ? 'bg-amber-500 text-black'
                        : 'bg-white/10 text-gray-300'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-sm font-bold text-white font-mono">
                    {isCaptain
                      ? 'Player 1 (You / Captain 👑)'
                      : isSubstitute
                      ? 'Substitute Player (Optional)'
                      : `Player ${idx + 1}${isOptional ? ' (Optional for CS)' : ''}`}
                  </span>
                </div>

                {isSubstitute && (
                  <button
                    type="button"
                    onClick={removeSubstitute}
                    className="text-xs text-rose-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* UID Field */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block">
                    Game UID {!isOptional && !isSubstitute && <span className="text-rose-400">*</span>}
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. 518293847`}
                    value={player.uid}
                    onChange={(e) => handlePlayerChange(idx, 'uid', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs font-mono outline-none focus:border-orange-500 focus:bg-white/[0.08]"
                  />
                  {errors[`player_${idx}_uid`] && (
                    <p className="text-[11px] text-rose-400">{errors[`player_${idx}_uid`]}</p>
                  )}
                </div>

                {/* IGN Field */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block">
                    In-Game Name (IGN) {!isOptional && !isSubstitute && <span className="text-rose-400">*</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SOULxMORTAL"
                    value={player.ign}
                    onChange={(e) => handlePlayerChange(idx, 'ign', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs outline-none focus:border-orange-500 focus:bg-white/[0.08]"
                  />
                  {errors[`player_${idx}_ign`] && (
                    <p className="text-xs text-rose-400">{errors[`player_${idx}_ign`]}</p>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide block">
                    Email <span className="text-slate-400 text-xs font-normal">(optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder={isCaptain ? captainEmail || 'captain@email.com' : 'player@email.com'}
                    value={player.email || ''}
                    onChange={(e) => handlePlayerChange(idx, 'email', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs outline-none focus:border-orange-500 focus:bg-white/[0.08]"
                  />
                </div>
              </div>
            </Card>
          );
        })}

        {/* Add 5th Substitute Button */}
        {players.length < 5 && selectedMode === 'CS' && (
          <button
            type="button"
            onClick={addSubstitute}
            className="w-full py-3 px-4 rounded-xl border border-dashed border-white/20 hover:border-orange-500/50 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-semibold text-orange-400 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add 5th Substitute Player (Optional for Clash Squad)</span>
          </button>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          className="w-full sm:w-auto h-11 px-6 text-xs"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Back</span>
        </Button>

        <Button
          type="submit"
          variant="primary"
          className="w-full sm:w-auto h-11 px-8 text-xs font-bold"
        >
          <span>Continue to Payment</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </form>
  );
}
