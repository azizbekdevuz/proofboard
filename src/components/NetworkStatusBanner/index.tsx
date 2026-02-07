"use client";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";

/**
 * Shows a small banner when the device is offline so users know why actions may fail.
 * Supports operation under poor/temporary disconnections (World App Technical Requirements).
 */
export function NetworkStatusBanner() {
  const online = useNetworkStatus();

  if (online) return null;

  return (
    <div
      className="bg-[var(--accent-amber)] bg-opacity-10 text-[var(--accent-amber)] text-center py-2 px-4 text-sm border-b border-[rgba(251,191,36,0.2)]"
      role="status"
      aria-live="polite"
    >
      No connection. Check your network and try again.
    </div>
  );
}
