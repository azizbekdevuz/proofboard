"use client";

import {
  MiniKit,
  VerificationLevel,
  ISuccessResult,
} from "@worldcoin/minikit-js";

/**
 * Get a World ID proof from MiniKit and return it. The proof is then sent to the
 * action endpoint (e.g. /api/questions, /api/answers), which verifies and stores
 * the nullifier. We do NOT call /api/verify here to avoid double-verify and "already_used".
 *
 * When verification is needed: once per protected action. Each "Post question",
 * "Post answer", or "Accept answer" must use a fresh proof; one proof = one use.
 * If the user tries to post again without verifying again in the app, the server
 * returns already_used and the UI shows: "Please try to verify again."
 */
export async function verifyAndConsume(
  action: string,
  signal?: string
): Promise<ISuccessResult> {
  if (!MiniKit.isInstalled()) {
    throw new Error("Please open this app in World App to verify");
  }

  const { finalPayload } = await MiniKit.commandsAsync.verify({
    action,
    signal,
    verification_level: VerificationLevel.Orb,
  });

  if (finalPayload.status === "error") {
    const errorCode = (finalPayload as { error_code?: string }).error_code;
    if (errorCode === "limit_reached") {
      throw new Error(
        "You've reached your limit for this action. Please try again later."
      );
    }
    throw new Error("Verification was rejected. Please try again.");
  }

  return finalPayload as ISuccessResult;
}
