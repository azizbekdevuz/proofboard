"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";
import { SessionProvider } from "next-auth/react";
import dynamic from "next/dynamic";
import { FallbackMiniKitProvider } from "@/contexts/FallbackMiniKitContext";
import { isMiniKitAvailable } from "@/lib/minikit-safe";
import type { ClientProvidersProps } from "@/lib/types";

const ErudaProvider = dynamic(
  () => import("@/providers/Eruda").then((c) => c.ErudaProvider),
  { ssr: false }
);

/** Only call when window exists; avoids MiniKit.isInstalled() console.error in browser. */
function checkMiniKitAvailable(): boolean {
  try {
    return isMiniKitAvailable();
  } catch {
    return false;
  }
}

const MiniKitAvailableContext = createContext<boolean | null>(null);

export function useMiniKitAvailableContext(): boolean | null {
  return useContext(MiniKitAvailableContext);
}

/** Delays (ms) to retry MiniKit check – World App may inject window.MiniKit shortly after load. */
const MINIKIT_CHECK_DELAYS = [0, 150, 400, 800];

/**
 * Check MiniKit availability without triggering the library's console.error.
 * Uses window.MiniKit check first so we never call MiniKit.isInstalled() in a normal browser.
 * Retries a few times so we detect MiniKit when it's injected slightly late (e.g. in World App).
 */
function useMiniKitAvailable(): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    MINIKIT_CHECK_DELAYS.forEach((delay, i) => {
      const t = setTimeout(() => {
        if (cancelled) return;
        if (checkMiniKitAvailable()) {
          setAvailable(true);
          return;
        }
        if (i === MINIKIT_CHECK_DELAYS.length - 1) setAvailable(false);
      }, delay);
      timeouts.push(t);
    });
    return () => {
      cancelled = true;
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, []);
  return available;
}

/**
 * ClientProvider wraps the app with essential context providers.
 * Only mounts MiniKitProvider when running inside World App; otherwise
 * uses FallbackMiniKitProvider to avoid "MiniKit is not installed" console errors.
 */
export default function ClientProviders({
  children,
  session,
}: ClientProvidersProps) {
  const miniKitAvailable = useMiniKitAvailable();

  const content = (
    <SessionProvider session={session}>{children}</SessionProvider>
  );

  return (
    <ErudaProvider>
      <MiniKitAvailableContext.Provider value={miniKitAvailable}>
        {miniKitAvailable === null ? (
          <FallbackMiniKitProvider>{content}</FallbackMiniKitProvider>
        ) : miniKitAvailable ? (
          <MiniKitProvider>{content}</MiniKitProvider>
        ) : (
          <FallbackMiniKitProvider>{content}</FallbackMiniKitProvider>
        )}
      </MiniKitAvailableContext.Provider>
    </ErudaProvider>
  );
}
