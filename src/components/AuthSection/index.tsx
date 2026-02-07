"use client";

import { AuthButton } from "@/components/AuthButton";
import { useMiniKitAvailableContext } from "@/providers";

/**
 * On the landing page: when MiniKit is not available (browser fallback),
 * show a static "Open in World App" message instead of AuthButton (which uses
 * useMiniKit() and would throw without MiniKitProvider).
 * While we're still detecting (null), show a loading skeleton so we don't
 * flash "Open in World App" when the user is already inside World App.
 */
export function AuthSection() {
  const available = useMiniKitAvailableContext();

  if (available === null) {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-sm animate-fade-in-up">
        <div className="skeleton w-full h-12 rounded-[14px]" />
      </div>
    );
  }

  if (available === false) {
    return (
      <div className="flex flex-col items-center gap-5 w-full max-w-sm animate-fade-in-up text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          Open this app in World App to continue
        </p>
        <p className="text-xs text-[var(--text-tertiary)]">
          MiniKit is not available in a regular browser.
        </p>
        <a
          href="https://world.app"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-accent w-full py-5 text-[15px] text-center no-underline"
        >
          Open in World App
        </a>
      </div>
    );
  }

  return <AuthButton />;
}
