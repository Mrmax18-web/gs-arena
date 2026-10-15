import { useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { stripUndefined } from '../lib/firestoreUtils';
import type { Branding } from '../types';
import { DEFAULT_BRANDING } from '../lib/brandingDefaults';

export type BrandingConfig = Branding;
export type { Branding };
export { DEFAULT_BRANDING };

const STORAGE_KEY = 'ttp_branding';

export function getLocalBranding(): Branding {
  try {
    const fallback = localStorage.getItem('branding-fallback');
    if (fallback) {
      const parsed = JSON.parse(fallback);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_BRANDING, ...parsed };
      }
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_BRANDING, ...parsed };
      }
    }
  } catch {
    // Ignore JSON parsing errors
  }
  return DEFAULT_BRANDING;
}

export function saveLocalBranding(branding: Branding): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
    localStorage.setItem('branding-fallback', JSON.stringify(branding));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ttp_branding_updated', { detail: branding }));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function useBranding() {
  const [branding, setBranding] = useState<Branding>(() => getLocalBranding());
  const [loading, setLoading] = useState(true);

  // Synchronize dynamic favicon with document head
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const faviconUrl = branding.favicon || DEFAULT_BRANDING.favicon;
    if (faviconUrl) {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;

      const appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
      if (appleLink) {
        appleLink.href = faviconUrl;
      }
    }
  }, [branding.favicon]);

  // Synchronize CSS custom properties for theme colors
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (branding.primaryColor) {
      root.style.setProperty('--color-brand-primary', branding.primaryColor);
    }
    if (branding.secondaryColor) {
      root.style.setProperty('--color-brand-secondary', branding.secondaryColor);
    }
  }, [branding.primaryColor, branding.secondaryColor]);

  // Listen to Firestore real-time updates and local broadcast events
  useEffect(() => {
    const handleLocalUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Branding>;
      if (customEvent.detail) {
        setBranding(customEvent.detail);
      } else {
        setBranding(getLocalBranding());
      }
    };

    window.addEventListener('ttp_branding_updated', handleLocalUpdate);

    const unsub = onSnapshot(
      doc(db, 'config', 'branding'),
      (snap) => {
        if (snap.exists()) {
          const remoteData = snap.data() as Partial<Branding>;
          const merged: Branding = {
            ...DEFAULT_BRANDING,
            ...remoteData,
            backgroundColors:
              Array.isArray(remoteData.backgroundColors) && remoteData.backgroundColors.length > 0
                ? remoteData.backgroundColors
                : DEFAULT_BRANDING.backgroundColors || ['#5A4AE0', '#F2D98A'],
          };
          setBranding(merged);
          saveLocalBranding(merged);
        } else {
          setBranding(getLocalBranding());
        }
        setLoading(false);
      },
      (err) => {
        console.warn('[Branding] Snapshot notice, using local cached branding:', err.message);
        setLoading(false);
      }
    );

    return () => {
      window.removeEventListener('ttp_branding_updated', handleLocalUpdate);
      unsub();
    };
  }, []);

  const saveBranding = useCallback(async (updates: Partial<Branding>) => {
    const current = getLocalBranding();
    const updated: Branding = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.email || 'creator',
    };
    saveLocalBranding(updated);
    setBranding(updated);
    try {
      await setDoc(doc(db, 'config', 'branding'), stripUndefined(updated), { merge: true });
    } catch (err) {
      console.warn('[Branding] Firestore sync notice:', err);
    }
  }, []);

  const updateBranding = saveBranding;

  const restoreDefaults = useCallback(async () => {
    const resetData: Branding = {
      ...DEFAULT_BRANDING,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.email || 'creator',
    };
    saveLocalBranding(resetData);
    setBranding(resetData);
    try {
      await setDoc(doc(db, 'config', 'branding'), resetData);
    } catch (err) {
      console.warn('[Branding] Firestore reset notice:', err);
    }
  }, []);

  return {
    branding,
    loading,
    saveBranding,
    updateBranding,
    restoreDefaults,
  };
}
