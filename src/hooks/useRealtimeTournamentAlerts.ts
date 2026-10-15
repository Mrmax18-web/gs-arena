import { useEffect, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from '../context/ToastContext';

// Pleasant, soft two-tone synthesized chime for real-time alerts
function playAlertChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    // Tone 1: D5 (587.33Hz) -> Tone 2: A5 (880Hz)
    osc1.frequency.setValueAtTime(587.33, now);
    osc2.frequency.setValueAtTime(880, now + 0.12);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.12);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.35);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 500);
  } catch {
    // AudioContext might be blocked until user gesture, safely ignore
  }
}

export function useRealtimeTournamentAlerts(tournamentId: string | undefined) {
  const { showToast } = useToast();

  const isMatchesInit = useRef(false);
  const isCSMatchesInit = useRef(false);
  const lastAlertTime = useRef<number>(0);

  useEffect(() => {
    if (!tournamentId) return;

    isMatchesInit.current = false;
    isCSMatchesInit.current = false;

    // Helper to throttle notifications (at most once every 4 seconds)
    const canAlert = () => {
      const now = Date.now();
      if (now - lastAlertTime.current > 4000) {
        lastAlertTime.current = now;
        return true;
      }
      return false;
    };

    // 1. Listen to Matches updates (triggers standings recalculation)
    const matchesRef = collection(db, 'tournaments', tournamentId, 'matches');
    const unsubMatches = onSnapshot(
      matchesRef,
      (snapshot) => {
        if (!isMatchesInit.current) {
          isMatchesInit.current = true;
          return;
        }

        // Check if there are modified or added matches
        const hasUpdates = snapshot.docChanges().some(
          (change) => change.type === 'added' || change.type === 'modified'
        );

        if (hasUpdates && canAlert()) {
          console.log('[Realtime Alert] Match results updated for tournament:', tournamentId);
          playAlertChime();
          showToast({
            type: 'tournament',
            title: '🏆 Standings Updated',
            message: 'Match results have been verified in real-time. Leaderboard standings are refreshed!',
            link: '/',
            linkText: 'View Leaderboard',
            duration: 6000,
          });
        }
      },
      () => {}
    );

    // 2. Listen to Clash Squad / Bracket matches
    const csMatchesRef = collection(db, 'tournaments', tournamentId, 'cs_matches');
    const unsubCSMatches = onSnapshot(
      csMatchesRef,
      (snapshot) => {
        if (!isCSMatchesInit.current) {
          isCSMatchesInit.current = true;
          return;
        }

        // Filter changes
        const hasBracketUpdates = snapshot.docChanges().some(
          (change) => change.type === 'added' || change.type === 'modified'
        );

        if (hasBracketUpdates && canAlert()) {
          console.log('[Realtime Alert] Clash Squad bracket updated for tournament:', tournamentId);
          playAlertChime();
          showToast({
            type: 'bracket',
            title: '⚔️ Tournament Bracket Updated',
            message: 'A Clash Squad playoff matchup has completed. Tournament bracket tree updated!',
            link: '/cs-bracket',
            linkText: 'View Bracket',
            duration: 6000,
          });
        }
      },
      () => {}
    );

    return () => {
      unsubMatches();
      unsubCSMatches();
    };
  }, [tournamentId, showToast]);
}
