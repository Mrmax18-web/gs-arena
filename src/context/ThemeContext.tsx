import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextType {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = 'gs-theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Returns the OS preference ('dark' or 'light').
 */
function getSystemPreference(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Reads initial theme from localStorage with safe fallback to 'system'.
 */
function getInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }
  return 'system';
}

/**
 * ThemeProvider manages light, dark, and system theme modes.
 * Synchronizes HTML root class, localStorage, and Firestore user preferences when authenticated.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [mode, setModeState] = useState<ThemeMode>(getInitialThemeMode);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemPreference);

  // Listen to OS system color scheme changes live
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, []);

  // Compute resolved theme
  const resolved: ResolvedTheme = useMemo(() => {
    if (mode === 'system') return systemTheme;
    return mode;
  }, [mode, systemTheme]);

  // Synchronize documentElement class and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Ignore storage errors
    }
  }, [mode, resolved]);

  // Firestore sync: users/{uid}/prefs/theme with onSnapshot
  useEffect(() => {
    if (!user?.uid) return;

    const themeDocRef = doc(db, 'users', user.uid, 'prefs', 'theme');

    const unsubscribe = onSnapshot(
      themeDocRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        if (data?.mode && (data.mode === 'light' || data.mode === 'dark' || data.mode === 'system')) {
          setModeState(data.mode as ThemeMode);
        }
      },
      (error) => {
        // Silently degrade to localStorage when offline or rules reject
        console.warn('Theme preference sync error:', error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Set mode handler, persisting to localStorage and Firestore if signed in
  const setMode = useCallback(
    (newMode: ThemeMode) => {
      setModeState(newMode);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newMode);
      } catch {
        // Ignore storage errors
      }

      if (user?.uid) {
        const themeDocRef = doc(db, 'users', user.uid, 'prefs', 'theme');
        setDoc(themeDocRef, { mode: newMode, updatedAt: serverTimestamp() }, { merge: true }).catch(
          (err) => console.warn('Failed saving theme preference to Firestore:', err)
        );
      }
    },
    [user?.uid]
  );

  const value = useMemo(
    () => ({
      mode,
      resolved,
      setMode,
    }),
    [mode, resolved, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to access active theme state and toggle handlers.
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
