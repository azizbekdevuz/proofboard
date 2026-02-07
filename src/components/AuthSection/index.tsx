"use client";

import { useFallbackMiniKit } from "@/contexts/FallbackMiniKitContext";
import { AuthButton } from "@/components/AuthButton";

/**
 * On the landing page: when MiniKit is not available (browser fallback),
 * show a static "Open in World App" message instead of AuthButton (which uses
 * useMiniKit() and would throw without MiniKitProvider).
 */
export function AuthSection() {
  const fallback = useFallbackMiniKit();

  if (fallback) {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-sm animate-fade-in-up text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          Open this app in World App to continue
        </p>
        <p className="text-xs text-[var(--text-tertiary)]">
          MiniKit is not available in a regular browser.
        </p>
      </div>
    );
  }

  return <AuthButton />;
}
