'use client';
import { walletAuth } from '@/auth/wallet';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * AuthButton component for ProofBoard
 * Handles Wallet Auth via MiniKit
 * Read More: https://docs.world.org/mini-apps/commands/wallet-auth
 */
export const AuthButton = () => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isInstalled } = useMiniKit();
  const hasAttemptedAuth = useRef(false);
  const { data: session } = useSession();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (session) {
      router.push('/home/thoughts');
    }
  }, [session, router]);

  const onClick = useCallback(async () => {
    if (!isInstalled || isPending) {
      return;
    }

    if (!isInstalled) {
      setError('Please open this app in World App');
      return;
    }

    setIsPending(true);
    setError(null);
    try {
      await walletAuth();
      // Redirect will happen via signIn redirectTo
    } catch (error) {
      console.error('Wallet authentication error', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Authentication failed. Please try again.',
      );
    } finally {
      setIsPending(false);
    }
  }, [isInstalled, isPending]);

  // Auto-authenticate on load when MiniKit is ready (only once)
  useEffect(() => {
    if (isInstalled === true && !hasAttemptedAuth.current && !session) {
      hasAttemptedAuth.current = true;
      setIsPending(true);
      walletAuth()
        .catch((error) => {
          console.error('Auto wallet authentication error', error);
          setError('Auto-login failed. Please tap the button to login.');
        })
        .finally(() => {
          setIsPending(false);
        });
    }
  }, [isInstalled, session]);

  if (session) {
    return null; // Don't show button if already authenticated
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      <LiveFeedback
        label={{
          failed: error || 'Failed to login',
          pending: 'Authenticating...',
          success: 'Logged in',
        }}
        state={isPending ? 'pending' : error ? 'failed' : undefined}
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
      {!isInstalled && (
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
