import React, { createContext, useContext, useState, useEffect } from 'react';
import { BackgroundConfig } from '../types/config';
import { DEFAULT_BACKGROUND_CONFIG } from '../lib/constants';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { backgroundConfigConverter } from '../lib/converters';

interface BackgroundContextType {
  config: BackgroundConfig;
  updateConfig: (partial: Partial<BackgroundConfig>) => void;
  resetToDefaults: () => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const BackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<BackgroundConfig>(DEFAULT_BACKGROUND_CONFIG);

  // Subscribe to Firestore config/background if Firebase is configured
  useEffect(() => {
    if (!isFirebaseConfigured() || !db) return;

    try {
      const ref = doc(db, 'config', 'background').withConverter(backgroundConfigConverter);
      const unsubscribe = onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data) {
              setConfig((prev) => ({
                ...prev,
                ...data,
                colors: data.colors?.length >= 2 ? data.colors : prev.colors,
                advanced: {
                  ...prev.advanced,
                  ...(data.advanced || {}),
                },
              }));
            }
          }
        },
        (err) => {
          console.warn('Background config fetch fallback to local defaults:', err.message);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Error subscribing to background config:', e);
    }
  }, []);

  const updateConfig = (partial: Partial<BackgroundConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...partial,
      colors: partial.colors && partial.colors.length >= 2 ? partial.colors : prev.colors,
      advanced: {
        ...prev.advanced,
        ...(partial.advanced || {}),
      },
    }));
  };

  const resetToDefaults = () => {
    setConfig(DEFAULT_BACKGROUND_CONFIG);
  };

  return (
    <BackgroundContext.Provider value={{ config, updateConfig, resetToDefaults }}>
      {children}
    </BackgroundContext.Provider>
  );
};

export function useBackground(): BackgroundContextType {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
}
