import React, { useState, useEffect, useRef } from 'react';
import { Swords, X, Volume2, ShieldAlert } from 'lucide-react';

export interface MatchCountdownProps {
  startedAt?: string | number;
  seconds?: number;
  matchTitle?: string;
  onComplete: () => void;
  onCancel?: () => void;
}

export function MatchCountdown({
  startedAt,
  seconds = 30,
  matchTitle,
  onComplete,
  onCancel,
}: MatchCountdownProps) {
  const [remaining, setRemaining] = useState<number>(seconds);
  const [cancelled, setCancelled] = useState(false);
  const hasTriggeredComplete = useRef(false);
  const lastBeepedSec = useRef<number>(-1);

  // Audio synthesize helpers
  const playTick = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
      setTimeout(() => ctx.close().catch(() => {}), 300);
    } catch {}
  };

  const playBuzzer = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc2.frequency.setValueAtTime(440, ctx.currentTime);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.7);
      osc2.stop(ctx.currentTime + 0.7);
      setTimeout(() => ctx.close().catch(() => {}), 900);
    } catch {}
  };

  useEffect(() => {
    hasTriggeredComplete.current = false;
    lastBeepedSec.current = -1;

    // Determine target completion time using wall-clock Date.now()
    const startTime = startedAt ? new Date(startedAt).getTime() : Date.now();
    const endTime = startTime + seconds * 1000;

    let animFrame: number;

    const tick = () => {
      if (cancelled || hasTriggeredComplete.current) return;

      const now = Date.now();
      const leftMs = Math.max(0, endTime - now);
      const leftSec = Math.ceil(leftMs / 1000);

      setRemaining(leftSec);

      // Beep at 10, 5, 3, 2, 1
      if (
        [10, 5, 3, 2, 1].includes(leftSec) &&
        lastBeepedSec.current !== leftSec
      ) {
        lastBeepedSec.current = leftSec;
        playTick();
      }

      if (leftMs <= 0) {
        hasTriggeredComplete.current = true;
        playBuzzer();
        onComplete();
      } else {
        animFrame = requestAnimationFrame(tick);
      }
    };

    animFrame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [startedAt, seconds, cancelled, onComplete]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl px-4 animate-in fade-in duration-300"
    >
      {/* Background glow orb */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-red-500/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-6">
        {/* Match Header Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-amber-300 uppercase tracking-widest">
          <Swords className="w-3.5 h-3.5" />
          <span>{matchTitle || 'Match Commencing'}</span>
        </div>

        {/* Large Countdown Digits */}
        <div className="relative py-4 flex items-center justify-center">
          <div className="text-8xl sm:text-9xl font-black tabular-nums font-mono tracking-tight bg-gradient-to-b from-amber-200 via-orange-400 to-red-500 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(249,115,22,0.6)]">
            {remaining}
          </div>
          <span className="absolute -bottom-2 text-xs uppercase tracking-widest text-white/40 font-bold">
            Seconds Left
          </span>
        </div>

        {/* State Notice */}
        <div className="space-y-1">
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase">
            {remaining <= 5 ? '⚠️ ALL SQUADS READY!' : 'Prepare For Drop!'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto">
            {remaining <= 5
              ? 'Final countdown initiated. No rematches permitted once timer ends.'
              : 'Verifying squad rosters and room credentials. Ensure all members are in lobby.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-4 flex flex-col items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={() => {
                setCancelled(true);
                onCancel();
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Abort Match Countdown</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Audio cues enabled at 10s, 5s, 3s, 2s, 1s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
