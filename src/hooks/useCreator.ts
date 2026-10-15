import { useState, useEffect, useCallback } from 'react';
import { getCreatorConfig, verifyCreatorPassword, type CreatorConfig } from '../lib/creator';

const CREATOR_SESSION_KEY = 'ttp_creator_unlocked_expires';

export function useCreator() {
  const [config, setConfig] = useState<CreatorConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreatorUnlocked, setIsCreatorUnlocked] = useState<boolean>(() => {
    try {
      const stored = sessionStorage.getItem(CREATOR_SESSION_KEY);
      if (!stored) return false;
      const expiresAt = parseInt(stored, 10);
      return Date.now() < expiresAt;
    } catch {
      return false;
    }
  });

  const refreshConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCreatorConfig();
      setConfig(data);
    } catch (err) {
      console.warn('Error refreshing creator config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConfig();

    const handleConfigUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<CreatorConfig>;
      if (customEvent?.detail) {
        setConfig(customEvent.detail);
      } else {
        refreshConfig();
      }
    };

    window.addEventListener('creator_config_updated', handleConfigUpdate);
    window.addEventListener('storage', handleConfigUpdate);
    return () => {
      window.removeEventListener('creator_config_updated', handleConfigUpdate);
      window.removeEventListener('storage', handleConfigUpdate);
    };
  }, [refreshConfig]);

  const unlock = async (password: string): Promise<boolean> => {
    const isValid = await verifyCreatorPassword(password);
    if (isValid) {
      const expiresAt = Date.now() + 30 * 60 * 1000;
      sessionStorage.setItem(CREATOR_SESSION_KEY, String(expiresAt));
      setIsCreatorUnlocked(true);
      await refreshConfig();
      return true;
    }
    return false;
  };

  const lock = () => {
    sessionStorage.removeItem(CREATOR_SESSION_KEY);
    setIsCreatorUnlocked(false);
  };

  return {
    isCreatorUnlocked,
    unlock,
    lock,
    config,
    loading,
    refreshConfig,
  };
}
