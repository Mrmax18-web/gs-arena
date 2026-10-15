import React, { createContext, useContext, useReducer, useEffect, useMemo, useRef, useCallback } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCreator } from '../hooks/useCreator';

export interface BackgroundState {
  enabled: boolean;
  density: number; // 0 - 100
  height: number;  // 0 - 100
  speed: number;   // 0 - 100
  angle: number;   // 0 - 360
  color1: string;  // Hex color
  color2: string;  // Hex color
  color3: string;  // Hex color
}

export interface TwistRibbonMappedProps {
  thickness: number;
  direction: number;
  speed: number;
  baseColor: string;
  accentColor: string;
  advanced: {
    halfWidth: number;
    boxHeight: number;
    goldColor: string;
    driftSec: number;
  };
}

export const DEFAULT_BACKGROUND_STATE: BackgroundState = {
  enabled: true,
  density: 50,
  height: 50,
  speed: 50,
  angle: 135,
  color1: '#FF6B35',
  color2: '#00D9FF',
  color3: '#FFB020',
};

const BG_STORAGE_KEY = 'gs-background-config';
const CLIENT_ID = typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : Math.random().toString(36).substring(2);

/**
 * Pure mapping function translating normalized UI slider ranges (0-100, 0-360)
 * into TwistRibbon's physical WebGL uniforms and advanced properties.
 *
 * Mapping documentation:
 * - density (0-100) -> thickness (40 to 240) and halfWidth (8 to 48)
 * - height  (0-100) -> boxHeight (20 to 180)
 * - speed   (0-100) -> speed (0 to 100) & driftSec (80s down to 8s)
 * - angle   (0-360) -> direction (0 to 360)
 * - color1          -> baseColor
 * - color2          -> accentColor
 * - color3          -> advanced.goldColor
 */
export function mapBackgroundToRibbon(state: BackgroundState): TwistRibbonMappedProps {
  const thickness = Math.round(40 + (Math.max(0, Math.min(100, state.density)) / 100) * 200);
  const halfWidth = Math.round(8 + (Math.max(0, Math.min(100, state.density)) / 100) * 40);
  const boxHeight = Math.round(20 + (Math.max(0, Math.min(100, state.height)) / 100) * 160);
  const speed = Math.max(0, Math.min(100, state.speed));
  const driftSec = Math.max(4, Math.round(80 - (speed / 100) * 72));
  const direction = ((state.angle % 360) + 360) % 360;

  return {
    thickness,
    direction,
    speed,
    baseColor: state.color1,
    accentColor: state.color2,
    advanced: {
      halfWidth,
      boxHeight,
      goldColor: state.color3,
      driftSec,
    },
  };
}

// Dev-only unit assertions verifying boundary safety
if (import.meta.env?.DEV) {
  const minAssert = mapBackgroundToRibbon({
    enabled: true,
    density: 0,
    height: 0,
    speed: 0,
    angle: 0,
    color1: '#000000',
    color2: '#111111',
    color3: '#222222',
  });
  console.assert(minAssert.thickness >= 20 && minAssert.thickness <= 300, 'Ribbon min thickness safe');
  console.assert(minAssert.advanced.halfWidth >= 2 && minAssert.advanced.halfWidth <= 50, 'Ribbon min halfWidth safe');
  console.assert(minAssert.advanced.boxHeight >= 5 && minAssert.advanced.boxHeight <= 200, 'Ribbon min boxHeight safe');
  console.assert(minAssert.direction === 0, 'Ribbon angle 0 normalized');

  const maxAssert = mapBackgroundToRibbon({
    enabled: true,
    density: 100,
    height: 100,
    speed: 100,
    angle: 360,
    color1: '#FFFFFF',
    color2: '#FFFFFF',
    color3: '#FFFFFF',
  });
  console.assert(maxAssert.thickness <= 300, 'Ribbon max thickness safe');
  console.assert(maxAssert.advanced.halfWidth <= 50, 'Ribbon max halfWidth safe');
  console.assert(maxAssert.advanced.boxHeight <= 200, 'Ribbon max boxHeight safe');
  console.assert(maxAssert.direction === 0, 'Ribbon angle 360 normalized to 0');
}

type BackgroundAction =
  | { type: 'SET'; payload: Partial<BackgroundState> }
  | { type: 'RESET' }
  | { type: 'SYNC_REMOTE'; payload: BackgroundState };

/**
 * Reducer for background configuration state changes.
 */
function backgroundReducer(state: BackgroundState, action: BackgroundAction): BackgroundState {
  switch (action.type) {
    case 'SET':
      return { ...state, ...action.payload };
    case 'RESET':
      return { ...DEFAULT_BACKGROUND_STATE };
    case 'SYNC_REMOTE':
      return { ...action.payload };
    default:
      return state;
  }
}

/**
 * Loads background state from localStorage with safe fallback to defaults.
 */
function getInitialBackgroundState(): BackgroundState {
  if (typeof window === 'undefined') return DEFAULT_BACKGROUND_STATE;
  try {
    const raw = localStorage.getItem(BG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_BACKGROUND_STATE, ...parsed };
    }
  } catch {
    // Ignore storage parse error
  }
  return DEFAULT_BACKGROUND_STATE;
}

export interface BackgroundContextType {
  state: BackgroundState;
  mappedProps: TwistRibbonMappedProps;
  setBackground: (partial: Partial<BackgroundState>) => void;
  resetBackground: () => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

/**
 * BackgroundProvider manages the state of the 3D Twist Ribbon background.
 * Syncs with Firestore 'config/background' in real-time, with debounced writes
 * for creators and echo-loop suppression.
 */
export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(backgroundReducer, undefined, getInitialBackgroundState);
  const { isCreatorUnlocked } = useCreator();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLocalUpdateRef = useRef(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore
    }
  }, [state]);

  // Firestore real-time listener on config/background
  useEffect(() => {
    const docRef = doc(db, 'config', 'background');

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        // Skip local echoes via metadata hasPendingWrites
        if (snapshot.metadata.hasPendingWrites) {
          return;
        }

        if (!snapshot.exists()) return;

        const data = snapshot.data();
        // Ignore snapshots created by this client to avoid echo loops
        if (data?.clientId === CLIENT_ID) {
          return;
        }

        const remoteState: BackgroundState = {
          enabled: data.enabled ?? DEFAULT_BACKGROUND_STATE.enabled,
          density: data.density ?? DEFAULT_BACKGROUND_STATE.density,
          height: data.height ?? DEFAULT_BACKGROUND_STATE.height,
          speed: data.speed ?? DEFAULT_BACKGROUND_STATE.speed,
          angle: data.angle ?? DEFAULT_BACKGROUND_STATE.angle,
          color1: data.color1 || DEFAULT_BACKGROUND_STATE.color1,
          color2: data.color2 || DEFAULT_BACKGROUND_STATE.color2,
          color3: data.color3 || DEFAULT_BACKGROUND_STATE.color3,
        };

        dispatch({ type: 'SYNC_REMOTE', payload: remoteState });
      },
      (error) => {
        console.warn('Real-time background sync notice:', error.message);
      }
    );

    return () => unsubscribe();
  }, []);

  // Write changes to Firestore when modified by creator (debounced 400ms)
  const saveToFirestoreDebounced = useCallback((newState: BackgroundState) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const docRef = doc(db, 'config', 'background');
        await setDoc(
          docRef,
          {
            ...newState,
            clientId: CLIENT_ID,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Firestore background write error:', err);
      }
    }, 400);
  }, []);

  const setBackground = useCallback(
    (partial: Partial<BackgroundState>) => {
      isLocalUpdateRef.current = true;
      dispatch({ type: 'SET', payload: partial });
      const nextState = { ...state, ...partial };
      if (isCreatorUnlocked) {
        saveToFirestoreDebounced(nextState);
      }
    },
    [state, isCreatorUnlocked, saveToFirestoreDebounced]
  );

  const resetBackground = useCallback(() => {
    isLocalUpdateRef.current = true;
    dispatch({ type: 'RESET' });
    if (isCreatorUnlocked) {
      saveToFirestoreDebounced(DEFAULT_BACKGROUND_STATE);
    }
  }, [isCreatorUnlocked, saveToFirestoreDebounced]);

  const mappedProps = useMemo(() => mapBackgroundToRibbon(state), [state]);

  const value = useMemo(
    () => ({
      state,
      mappedProps,
      setBackground,
      resetBackground,
    }),
    [state, mappedProps, setBackground, resetBackground]
  );

  return <BackgroundContext.Provider value={value}>{children}</BackgroundContext.Provider>;
}

/**
 * Hook to access background state and controls.
 */
export function useBackground(): BackgroundContextType {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
}
