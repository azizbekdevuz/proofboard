"use client";

import { Component } from "react";
import { SessionProvider } from "next-auth/react";
import { FallbackMiniKitProvider } from "@/contexts/FallbackMiniKitContext";
import type {
  MiniKitErrorBoundaryProps,
  MiniKitErrorBoundaryState,
} from "@/lib/types";

/**
 * Catches MiniKit "not installed" (and similar) errors when the app is opened
 * in a normal browser instead of inside World App. Renders the app in fallback
 * mode (zero safe area, no MiniKit) so the UI still works and shows "Open in World App".
 */
export class MiniKitErrorBoundary extends Component<
  MiniKitErrorBoundaryProps,
  MiniKitErrorBoundaryState
> {
  constructor(props: MiniKitErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: unknown): MiniKitErrorBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  isMiniKitError(error: Error): boolean {
    const msg = error.message?.toLowerCase() ?? "";
    return (
      msg.includes("minikit") ||
      msg.includes("minkit") ||
      msg.includes("not installed") ||
      msg.includes("intleld") ||
      msg.includes("intled") ||
      msg.includes("world app")
    );
  }

  render() {
    if (this.state.error && this.isMiniKitError(this.state.error)) {
      return (
        <FallbackMiniKitProvider>
          <SessionProvider session={this.props.session}>
            {this.props.fallbackContent}
          </SessionProvider>
        </FallbackMiniKitProvider>
      );
    }

    if (this.state.error) {
      throw this.state.error;
    }

    return this.props.children;
  }
}
