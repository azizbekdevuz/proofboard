import { MiniKit } from "@worldcoin/minikit-js";

/**
 * Safe MiniKit availability check that does NOT call MiniKit.isInstalled()
 * when we're in a normal browser (window.MiniKit is missing). The minikit-js
 * library logs a console.error inside isInstalled() when not in World App;
 * checking window.MiniKit first avoids that.
 */
export function isMiniKitAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as { MiniKit?: unknown };
  if (!w.MiniKit) return false;
  try {
    return MiniKit.isInstalled() === true;
  } catch {
    return false;
  }
}
