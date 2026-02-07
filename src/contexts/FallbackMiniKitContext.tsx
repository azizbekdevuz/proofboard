"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface FallbackInsets {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

const DEFAULT_INSETS: FallbackInsets = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const FallbackMiniKitContext = createContext<FallbackInsets | null>(null);

export function FallbackMiniKitProvider({ children }: { children: ReactNode }) {
  return (
    <FallbackMiniKitContext.Provider value={DEFAULT_INSETS}>
      {children}
    </FallbackMiniKitContext.Provider>
  );
}

export function useFallbackMiniKit(): FallbackInsets | null {
  return useContext(FallbackMiniKitContext);
}
