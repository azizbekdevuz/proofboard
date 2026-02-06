"use client";

import { Component } from "react";
import type { MiniKitErrorBoundaryProps, MiniKitErrorBoundaryState } from "@/libs/types";

/**
 * Catches MiniKit "not installed" (and similar) errors when the app is opened
 * in a normal browser instead of inside World App, and shows a friendly message.
 */
export class MiniKitErrorBoundary extends Component<MiniKitErrorBoundaryProps, MiniKitErrorBoundaryState> {
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
      msg.includes("world app")
    );
  }

  render() {
    if (this.state.error && this.isMiniKitError(this.state.error)) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-white text-center">
          <div className="max-w-sm space-y-4">
            <h1 className="text-lg font-semibold text-gray-900">
              Open in World App
            </h1>
            <p className="text-sm text-gray-600">
              This app runs inside World App. Open the link from World App, or
              scan the QR code in the Mini App settings to continue.
            </p>
            <p className="text-xs text-gray-500">
              MiniKit is not available in a regular browser.
            </p>
          </div>
        </div>
      );
    }

    if (this.state.error) {
      throw this.state.error;
    }

    return this.props.children;
  }
}
