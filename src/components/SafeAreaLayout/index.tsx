"use client";

import { useSafeAreaInsets } from "@worldcoin/mini-apps-ui-kit-react";
import { NetworkStatusBanner } from "@/components/NetworkStatusBanner";
import { useFallbackMiniKit } from "@/contexts/FallbackMiniKitContext";

/**
 * Inner layout that uses MiniKit safe area insets (may throw when not in World App).
 */
function SafeAreaLayoutWithHook({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <div
      className="flex h-dvh flex-col main-tint"
      style={{
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <NetworkStatusBanner />
      {children}
    </div>
  );
}

/**
 * Safe area layout – uses MiniKit insets in World App, or zero insets in browser (fallback).
 */
export function SafeAreaLayout({ children }: { children: React.ReactNode }) {
  const fallback = useFallbackMiniKit();

  if (fallback) {
    return (
      <div
        className="flex h-dvh flex-col main-tint"
        style={{
          paddingTop: fallback.top,
          paddingLeft: fallback.left,
          paddingRight: fallback.right,
        }}
      >
        <NetworkStatusBanner />
        {children}
      </div>
    );
  }

  return <SafeAreaLayoutWithHook>{children}</SafeAreaLayoutWithHook>;
}
