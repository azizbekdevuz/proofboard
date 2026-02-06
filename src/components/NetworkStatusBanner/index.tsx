'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';

/**
 * Shows a small banner when the device is offline so users know why actions may fail.
 * Supports operation under poor/temporary disconnections (World App Technical Requirements).
 */
export function NetworkStatusBanner() {
  const online = useNetworkStatus();

  if (online) return null;

  return (
    <div
      className="bg-yellow-100 text-yellow-900 text-center py-2 px-4 text-sm"
      role="status"
      aria-live="polite"
    >
      No connection. Check your network and try again.
    </div>
  );
}
