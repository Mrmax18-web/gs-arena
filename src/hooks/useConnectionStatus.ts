import { useEffect, useState } from 'react';

export function useConnectionStatus(): 'online' | 'offline' | 'connecting' {
  const [status, setStatus] = useState<'online' | 'offline' | 'connecting'>(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'offline';
    }
    return 'online';
  });

  useEffect(() => {
    // Give Firestore and socket time to establish
    const timer = setTimeout(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        setStatus('online');
      }
    }, 10000);

    const handleOnline = () => setStatus('online');
    const handleOffline = () => setStatus('offline');

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setStatus('offline');
    } else {
      setStatus('online');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
}
