import React, { useState, useEffect } from 'react';
import { TwistRibbon } from './TwistRibbon';
import { useBackground } from '../../context/BackgroundContext';
import { useTheme } from '../../context/ThemeContext';

export interface GlobalRibbonProps {
  lightModeOpacity?: number;
}

/**
 * Global background layer rendering the WebGL TwistRibbon.
 * Mounted at z-index 0 on all routes.
 * Automatically respects visibilitychange (pauses when hidden)
 * and prefers-reduced-motion (freezes speed to 0).
 * In light mode, applies a calibrated 35% opacity and contrast overlay.
 */
export function GlobalRibbon({ lightModeOpacity = 0.35 }: GlobalRibbonProps) {
  const { state, mappedProps } = useBackground();
  const { resolved } = useTheme();
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const handleVisibility = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);

    const handler = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    if (media.addEventListener) {
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    }
  }, []);

  if (!state.enabled || !isVisible) {
    return null;
  }

  // Freeze on frame 0 if reduced motion is requested
  const effectiveProps = {
    ...mappedProps,
    speed: reducedMotion ? 0 : mappedProps.speed,
    background: resolved === 'dark' ? '#03040A' : '#F7F8FA',
  };

  const isLight = resolved === 'light';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden transition-opacity duration-300"
      style={{
        opacity: isLight ? lightModeOpacity : 1,
      }}
    >
      <TwistRibbon {...(effectiveProps as Record<string, unknown>)} />

      {/* Light mode contrast protective gradient overlay */}
      {isLight && (
        <div
          className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/40 via-transparent to-white/60"
          style={{ mixBlendMode: 'soft-light' }}
        />
      )}
    </div>
  );
}
