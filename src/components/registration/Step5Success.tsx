import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Trophy, ArrowRight, ShieldCheck, Mail, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface Step5SuccessProps {
  teamName: string;
  registrationId: string;
  captainEmail: string;
  game: string;
  mode: string;
}

export function Step5Success({
  teamName,
  registrationId,
  captainEmail,
  game,
  mode,
}: Step5SuccessProps) {
  useEffect(() => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  }, []);

  const referenceCode = registrationId
    ? `REG-${registrationId.slice(0, 8).toUpperCase()}`
    : `REG-${Date.now().toString().slice(-6)}`;

  return (
    <div className="space-y-6 text-center animate-in zoom-in-95 duration-400 max-w-lg mx-auto py-4">
      {/* Success Icon */}
      <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 mx-auto flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/20">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-3xl sm:text-4xl font-black font-['Teko',sans-serif] uppercase tracking-wide text-white">
          Registration Submitted!
        </h2>
        <p className="text-xs sm:text-sm text-gray-400">
          Your squad application and payment verification receipt have been queued for administrative review.
        </p>
      </div>

      {/* Summary Card */}
      <Card className="p-6 text-left space-y-3.5 bg-black/60 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between text-xs pb-2.5 border-b border-white/10">
          <span className="text-gray-400">Team</span>
          <strong className="text-white font-bold">{teamName}</strong>
        </div>

        <div className="flex items-center justify-between text-xs pb-2.5 border-b border-white/10">
          <span className="text-gray-400">Circuit</span>
          <span className="text-orange-400 font-mono font-bold">
            {game} ({mode})
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pb-2.5 border-b border-white/10">
          <span className="text-gray-400">Reference ID</span>
          <code className="text-amber-300 font-mono font-bold text-xs bg-white/5 px-2 py-0.5 rounded border border-white/10 select-all">
            {referenceCode}
          </code>
        </div>

        <div className="flex items-center justify-between text-xs pb-2.5 border-b border-white/10">
          <span className="text-gray-400">Status</span>
          <span className="font-bold text-amber-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Pending admin approval
          </span>
        </div>

        <div className="pt-1 text-xs text-gray-300 flex items-start gap-2 bg-white/[0.02] p-3 rounded-xl border border-white/5">
          <Mail className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed text-[11px]">
            You'll receive an email at <strong className="text-white">{captainEmail}</strong> when approved.
          </span>
        </div>
      </Card>

      <div className="pt-3">
        <Link to="/">
          <Button variant="primary" className="w-full sm:w-auto px-8 py-3 text-xs font-bold">
            <span>View Leaderboard</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
