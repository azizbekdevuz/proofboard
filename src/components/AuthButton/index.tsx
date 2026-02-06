"use client";
import { walletAuth } from "@/auth/wallet";
import { Button, LiveFeedback } from "@worldcoin/mini-apps-ui-kit-react";
import { MiniKit } from "@worldcoin/minikit-js";
import { useMiniKit } from "@worldcoin/minikit-js/minikit-provider";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * AuthButton component for ProofBoard
 * Handles Wallet Auth via MiniKit
 * Read More: https://docs.world.org/mini-apps/commands/wallet-auth
 */
export const AuthButton = () => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const { isInstalled: isInstalledFromHook } = useMiniKit();
  const hasAttemptedAuth = useRef(false);
  const { data: session } = useSession();
  const router = useRouter();

  // Check if MiniKit is installed (guard in case .isInstalled() throws outside World App)
  const isInstalled = (() => {
    if (isInstalledFromHook === true) return true;
    try {
      return MiniKit.isInstalled() === true;
    } catch {
      return false;
    }
  })();

  // Wait a bit for MiniKit to initialize, then check
  useEffect(() => {
    const checkMiniKit = () => {
      try {
        const installed = MiniKit.isInstalled();
        console.log("MiniKit check:", {
          hook: isInstalledFromHook,
          direct: installed,
          final: isInstalled,
        });
      } catch (e) {
        console.warn("MiniKit not available (open in World App):", e);
      }
      setIsChecking(false);
    };

    checkMiniKit();
    const timeout = setTimeout(checkMiniKit, 500);
    return () => clearTimeout(timeout);
  }, [isInstalledFromHook, isInstalled]);

  // Redirect if already authenticated
  useEffect(() => {
    if (session) {
      router.push("/home");
    }
  }, [session, router]);

  const onClick = useCallback(async () => {
    // Double-check MiniKit is installed before proceeding
    if (!MiniKit.isInstalled()) {
      setError("Please open this app in World App");
      return;
    }

    if (isPending) {
      return;
    }

    setIsPending(true);
    setError(null);
    try {
      await walletAuth();
      // Redirect will happen via signIn redirectTo
    } catch (error) {
      console.error("Wallet authentication error", error);
      const msg = error instanceof Error ? error.message : "";
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
  }, [isPending]);

  // Auto-authenticate on load when MiniKit is ready (only once)
  useEffect(() => {
    if (!isChecking && isInstalled && !hasAttemptedAuth.current && !session) {
      hasAttemptedAuth.current = true;
      setIsPending(true);
      walletAuth()
        .catch((error) => {
          console.error("Auto wallet authentication error", error);
          const msg = error instanceof Error ? error.message : "";
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
        .finally(() => {
          setIsPending(false);
        });
    }
  }, [isChecking, isInstalled, session]);

  if (session) {
    return null; // Don't show button if already authenticated
  }

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <Button disabled size="lg" variant="primary" className="w-full">
          Checking...
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      <LiveFeedback
        label={{
          failed: error || "Failed to login",
          pending: "Authenticating...",
          success: "Logged in",
        }}
        state={isPending ? "pending" : error ? "failed" : undefined}
      >
        <Button
          onClick={onClick}
          disabled={isPending || !isInstalled}
          size="lg"
          variant="primary"
          className="w-full"
        >
          Continue with World
        </Button>
      </LiveFeedback>
      {!isInstalled && !isChecking && (
        <p className="text-sm text-gray-500 text-center">
          Open this app in World App to continue
        </p>
      )}
      {error && !isPending && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
};
