'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks online/offline status for poor-connection handling (World App Technical Requirements).
 * Uses standard navigator.onLine and events; works on Android and iOS WebView.
 */
export function useNetworkStatus(): boolean {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}
