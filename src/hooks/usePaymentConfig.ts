import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  getPaymentConfig,
  savePaymentConfig,
  type PaymentConfig,
} from '../lib/creator';

export function usePaymentConfig() {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshConfig = useCallback(async () => {
    try {
      const data = await getPaymentConfig();
      setConfig(data);
    } catch (err) {
      console.warn('Error refreshing payment config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConfig();

    // Listen to local broadcast events
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<PaymentConfig>;
      if (customEvent?.detail) {
        setConfig(customEvent.detail);
      } else {
        refreshConfig();
      }
    };

    window.addEventListener('payment_config_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Also listen to Firestore real-time doc updates
    let unsubscribe = () => {};
    try {
      const docRef = doc(db, 'config', 'payment');
      unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as PaymentConfig;
            if (data && data.upiId) {
              setConfig(data);
              setLoading(false);
            }
          }
        },
        (err) => {
          console.warn('Payment config snapshot notice:', err);
        }
      );
    } catch (err) {
      console.warn('Firestore onSnapshot setup notice for payment config:', err);
    }

    return () => {
      window.removeEventListener('payment_config_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      unsubscribe();
    };
  }, [refreshConfig]);

  const saveConfig = async (partial: Partial<PaymentConfig>): Promise<PaymentConfig> => {
    const updated = await savePaymentConfig(partial);
    setConfig(updated);
    return updated;
  };

  return {
    config,
    loading,
    saveConfig,
    refreshConfig,
  };
}
