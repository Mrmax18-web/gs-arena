import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  CheckCircle2,
  AlertCircle,
  Gamepad2,
  User,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Game, Mode } from '../../types';

export interface Step2TeamDetailsProps {
  selectedGame: Game;
  selectedMode: Mode;
  teamName: string;
  setTeamName: (val: string) => void;
  teamTag: string;
  setTeamTag: (val: string) => void;
  captainName: string;
  setCaptainName: (val: string) => void;
  captainPhone: string;
  setCaptainPhone: (val: string) => void;
  captainEmail: string;
  setCaptainEmail: (val: string) => void;
  logoUrl: string;
  setLogoUrl: (val: string) => void;
  onChangeGame: () => void;
  onBack: () => void;
  onNext: () => void;
}

export function Step2TeamDetails({
  selectedGame,
  selectedMode,
  teamName,
  setTeamName,
  teamTag,
  setTeamTag,
  captainName,
  setCaptainName,
  captainPhone,
  setCaptainPhone,
  captainEmail,
  setCaptainEmail,
  logoUrl,
  setLogoUrl,
  onChangeGame,
  onBack,
  onNext,
}: Step2TeamDetailsProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoInputType, setLogoInputType] = useState<'upload' | 'url'>('upload');

  const cleanPhone = captainPhone.replace(/\D/g, '');
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(captainEmail.trim());
  const phoneValid = cleanPhone.length === 10;
  const nameValid = teamName.trim().length >= 2;
  const captainValid = captainName.trim().length >= 2;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!nameValid) {
      errs.teamName = 'Team name is required (min 2 characters)';
    }
    if (!captainValid) {
      errs.captainName = 'Captain full name is required';
    }
    if (!phoneValid) {
      errs.captainPhone = 'Phone must be a valid 10-digit number';
    }
    if (!emailValid) {
      errs.captainEmail = 'A valid email address is required';
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, logo: 'Logo image must be under 3 MB' }));
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setLogoUrl(event.target.result);
          setErrors((prev) => ({ ...prev, logo: '' }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleContinue} className="space-y-6 animate-in fade-in duration-300">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider block">
            Step 2 of 4
          </span>
          <h2 className="text-3xl font-black font-['Teko',sans-serif] uppercase tracking-wide text-white">
            Team & Captain Profile
          </h2>
        </div>

        {/* Selected Game Strip */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 self-start sm:self-auto">
          <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
            <span>Game:</span>
            <strong className="text-white font-mono">
              {selectedGame === 'BGMI' ? '🎮 BGMI' : '🔥 Free Fire'}
            </strong>
          </span>
          <button
            type="button"
            onClick={onChangeGame}
            className="text-[11px] font-bold text-orange-400 hover:text-orange-300 cursor-pointer underline ml-1"
          >
            [Change]
          </button>
        </div>
      </div>

      <Card className="p-6 space-y-6 bg-black/40 border border-white/10">
        {/* Team Identity Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wide flex items-center justify-between">
              <span>
                Team Name <span className="text-rose-400">*</span>
              </span>
              {nameValid && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </label>
            <input
              type="text"
              placeholder="e.g. Soul Warriors"
              value={teamName}
              onChange={(e) => {
                setTeamName(e.target.value);
                if (errors.teamName) setErrors((prev) => ({ ...prev, teamName: '' }));
              }}
              className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm outline-none focus:border-orange-500 focus:bg-white/[0.08] transition-all"
            />
            {errors.teamName && (
              <p className="text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.teamName}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wide block">
              Team Tag <span className="text-slate-400 text-xs font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. SOUL"
              maxLength={5}
              value={teamTag}
              onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
              className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm font-mono uppercase tracking-wider outline-none focus:border-orange-500 focus:bg-white/[0.08] transition-all"
            />
          </div>
        </div>

        {/* Divider: Captain Details */}
        <div className="pt-2 border-t border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
            <User className="w-3.5 h-3.5 text-orange-400" />
            <span>─── CAPTAIN INFORMATION ───</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wide flex items-center justify-between">
                <span>
                  Full Name <span className="text-rose-400">*</span>
                </span>
                {captainValid && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </label>
              <input
                type="text"
                placeholder="e.g. Aman Jain"
                value={captainName}
                onChange={(e) => {
                  setCaptainName(e.target.value);
                  if (errors.captainName) setErrors((prev) => ({ ...prev, captainName: '' }));
                }}
                className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm outline-none focus:border-orange-500 focus:bg-white/[0.08] transition-all"
              />
              {errors.captainName && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.captainName}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wide flex items-center justify-between">
                <span>
                  Phone <span className="text-rose-400">*</span>
                </span>
                {phoneValid && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="10-digit phone number"
                value={cleanPhone}
                onChange={(e) => {
                  setCaptainPhone(e.target.value.replace(/\D/g, ''));
                  if (errors.captainPhone) setErrors((prev) => ({ ...prev, captainPhone: '' }));
                }}
                className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm font-mono outline-none focus:border-orange-500 focus:bg-white/[0.08] transition-all"
              />
              {errors.captainPhone && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.captainPhone}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wide flex items-center justify-between">
                <span>
                  Email <span className="text-rose-400">*</span>
                </span>
                {emailValid && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </label>
              <input
                type="email"
                placeholder="captain@gmail.com"
                value={captainEmail}
                onChange={(e) => {
                  setCaptainEmail(e.target.value);
                  if (errors.captainEmail) setErrors((prev) => ({ ...prev, captainEmail: '' }));
                }}
                className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm outline-none focus:border-orange-500 focus:bg-white/[0.08] transition-all"
              />
              {errors.captainEmail && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.captainEmail}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Divider: Team Logo */}
        <div className="pt-2 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider block">
              ─── TEAM LOGO (optional) ───
            </span>
            <div className="flex items-center gap-1 text-[11px] bg-white/5 rounded-lg p-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => setLogoInputType('upload')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  logoInputType === 'upload' ? 'bg-orange-500 text-white font-bold' : 'text-gray-400'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setLogoInputType('url')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  logoInputType === 'url' ? 'bg-orange-500 text-white font-bold' : 'text-gray-400'
                }`}
              >
                Paste URL
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Logo Preview box */}
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-6 h-6 text-gray-500" />
              )}
            </div>

            <div className="flex-1 w-full space-y-2">
              {logoInputType === 'upload' ? (
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-dashed border-white/20 bg-white/[0.03] hover:border-orange-500/50 hover:bg-white/[0.06] cursor-pointer text-xs font-semibold text-gray-300 transition-colors">
                    <Upload className="w-4 h-4 text-orange-400" />
                    <span>Upload Logo Image (PNG, JPG, WEBP)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="text-xs text-rose-400 hover:text-white px-2 py-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs outline-none focus:border-orange-500"
                  />
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="text-xs text-rose-400 hover:text-white px-2 py-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          {errors.logo && <p className="text-xs text-rose-400">{errors.logo}</p>}
        </div>
      </Card>

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
          <span>Continue to Roster</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </form>
  );
}
