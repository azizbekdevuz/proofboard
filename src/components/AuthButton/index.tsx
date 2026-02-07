"use client";

import { walletAuth } from "@/auth/wallet";
import { LiveFeedback } from "@worldcoin/mini-apps-ui-kit-react";
import { MiniKit } from "@worldcoin/minikit-js";
import { useMiniKit } from "@worldcoin/minikit-js/minikit-provider";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMiniKitAvailableContext } from "@/providers";

/**
 * Rendered only when MiniKit is available (inside World App). Uses useMiniKit() safely.
 */
function AuthButtonWithMiniKit() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isInstalled: isInstalledFromHook } = useMiniKit();
  const hasAttemptedAuth = useRef(false);
  const { data: session } = useSession();
  const router = useRouter();

  const isInstalled = isInstalledFromHook === true;

  useEffect(() => {
    if (session) router.push("/home");
  }, [session, router]);

  const onClick = useCallback(async () => {
    if (!isInstalled) {
      setError("Please open this app in World App");
      return;
    }
    if (isPending) return;
    setIsPending(true);
    setError(null);
    try {
      await walletAuth();
    } catch (err) {
      console.error("Wallet authentication error", err);
      const msg = err instanceof Error ? err.message : "";
      const isNotInstalled =
        /minikit?\s+is\s+not\s+installed|not\s+installed|world\s+app/i.test(
          msg
        );
      setError(
        isNotInstalled
          ? "Open this app in World App to continue"
          : msg || "Authentication failed. Please try again."
      );
    } finally {
      setIsPending(false);
    }
  }, [isPending, isInstalled]);

  useEffect(() => {
    if (isInstalled && !hasAttemptedAuth.current && !session) {
      hasAttemptedAuth.current = true;
      setIsPending(true);
      walletAuth()
        .catch((err) => {
          console.error("Auto wallet authentication error", err);
          const msg = err instanceof Error ? err.message : "";
          const isNotInstalled =
            /minikit?\s+is\s+not\s+installed|not\s+installed|world\s+app/i.test(
              msg
            );
          setError(
            isNotInstalled
              ? "Open this app in World App to continue"
              : "Auto-login failed. Please tap the button to login."
          );
        })
        .finally(() => setIsPending(false));
    }
  }, [isInstalled, session]);

  if (session) return null;

  return (
    <div
      className="flex flex-col items-center gap-4 w-full max-w-sm animate-fade-in-up"
      style={{ animationDelay: "200ms" }}
    >
      <LiveFeedback
        label={{
          failed: error || "Failed to login",
          pending: "Authenticating...",
          success: "Logged in",
        }}
        state={isPending ? "pending" : error ? "failed" : undefined}
      >
        <button
          onClick={onClick}
          disabled={isPending || !isInstalled}
          className="btn-accent w-full py-5 text-[15px] disabled:opacity-40"
        >
          Continue with World
        </button>
      </LiveFeedback>
      {!isInstalled && (
        <p className="text-sm text-[var(--text-tertiary)] text-center">
          Open this app in World App to continue
        </p>
      )}
      {error && !isPending && (
        <p className="text-sm text-[var(--accent-rose)] text-center">{error}</p>
      )}
    </div>
  );
}

/**
 * Rendered when MiniKit is not available (regular browser). Never calls useMiniKit() or MiniKit.*.
 */
function AuthButtonFallback() {
  return (
    <div
      className="flex flex-col items-center gap-4 w-full max-w-sm animate-fade-in-up"
      style={{ animationDelay: "200ms" }}
    >
      <div className="skeleton w-full h-12 rounded-[14px]" />
      <p className="text-sm text-[var(--text-tertiary)] text-center">
        Open this app in World App to continue
      </p>
    </div>
  );
}

/**
 * AuthButton – dark premium login flow. Only calls MiniKit/useMiniKit when running inside World App.
 */
export const AuthButton = () => {
  const available = useMiniKitAvailableContext();

  if (available === null) {
    return (
      <div
        className="flex flex-col items-center gap-4 w-full max-w-sm animate-fade-in-up"
        style={{ animationDelay: "200ms" }}
      >
        <div className="skeleton w-full h-12 rounded-[14px]" />
      </div>
    );
  }

  if (available === false) {
    return <AuthButtonFallback />;
  }

  return <AuthButtonWithMiniKit />;
};
