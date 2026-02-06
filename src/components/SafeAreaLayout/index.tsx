"use client";

import { useSafeAreaInsets } from "@worldcoin/mini-apps-ui-kit-react";
import { Navigation } from "@/components/Navigation";
import { NetworkStatusBanner } from "@/components/NetworkStatusBanner";
import { Page } from "@/components/PageLayout";

/**
 * Wraps protected app content and applies MiniKit safe area insets
 * so content does not sit under notches or home indicators in World App.
 * See: https://docs.world.org/mini-apps/quick-start/init (deviceProperties.safeAreaInsets)
 */
export function SafeAreaLayout({ children }: { children: React.ReactNode }) {
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
      <Page.Footer
        className="px-0 fixed bottom-0 w-full glass border-t border-white/20"
        style={{ paddingBottom: `${35 + insets.bottom}px` }}
      >
        <Navigation />
      </Page.Footer>
    </div>
  );
}
