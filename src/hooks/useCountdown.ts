import { useState, useEffect } from 'react';
import { formatTimeRemaining, isRegistrationExpired, isDeadlineNear } from '../lib/deadline';

export interface CountdownState {
  formatted: string;
  remainingMs: number;
  remainingSeconds: number;
  isExpired: boolean;
  isNear: boolean;
}

export function useCountdown(deadlineStr: string | null | undefined, nearHoursThreshold = 24): CountdownState {
  const [state, setState] = useState<CountdownState>(() => {
    if (!deadlineStr) {
      return {
        formatted: '',
        remainingMs: 0,
        remainingSeconds: 0,
        isExpired: false,
        isNear: false,
      };
    }
    const target = new Date(deadlineStr).getTime();
    const diff = target - Date.now();
    return {
      formatted: formatTimeRemaining(deadlineStr),
      remainingMs: Math.max(0, diff),
      remainingSeconds: Math.max(0, Math.floor(diff / 1000)),
      isExpired: isRegistrationExpired(deadlineStr),
      isNear: isDeadlineNear(deadlineStr, nearHoursThreshold),
    };
  });

  useEffect(() => {
    if (!deadlineStr) {
      setState({
        formatted: '',
        remainingMs: 0,
        remainingSeconds: 0,
        isExpired: false,
        isNear: false,
      });
      return;
    }

    const update = () => {
      const target = new Date(deadlineStr).getTime();
      const diff = target - Date.now();
      setState({
        formatted: formatTimeRemaining(deadlineStr),
        remainingMs: Math.max(0, diff),
        remainingSeconds: Math.max(0, Math.floor(diff / 1000)),
        isExpired: diff <= 0,
        isNear: isDeadlineNear(deadlineStr, nearHoursThreshold),
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadlineStr, nearHoursThreshold]);

  return state;
}
