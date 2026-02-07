import { MiniKit } from "@worldcoin/minikit-js";

/**
 * Safe check for "we are inside World App". Used to decide whether to mount
 * MiniKitProvider and show the auth flow.
 *
 * - In a normal browser: neither window.WorldApp nor window.MiniKit exist.
 * - In World App: the host injects window.WorldApp. window.MiniKit is only
 *   set after MiniKit.install() runs inside MiniKitProvider — so we must
 *   not require window.MiniKit here, or we never mount the provider and
 *   always show "Open in World App" even when already in the app.
 *
 * So we treat window.WorldApp as the signal: if it exists, we're in World App,
 * mount MiniKitProvider (which calls MiniKit.install()), and show AuthButton.
 */
export function isMiniKitAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as { WorldApp?: unknown; MiniKit?: unknown };
  if (w.WorldApp) return true;
  if (!w.MiniKit) return false;
  try {
    return MiniKit.isInstalled() === true;
  } catch {
    return false;
  }
}
