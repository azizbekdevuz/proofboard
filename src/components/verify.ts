"use client";

import { MiniKit, VerificationLevel, ISuccessResult } from "@worldcoin/minikit-js";
import { fetchWithTimeout, FETCH_TIMEOUT_WRITE_MS } from "@/lib/network";

export async function verifyAndConsume(action: string, signal?: string): Promise<ISuccessResult> {
  if (!MiniKit.isInstalled()) {
    throw new Error("Please open this app in World App to verify");
  }

  const { finalPayload } = await MiniKit.commandsAsync.verify({
    action,
    signal,
    verification_level: VerificationLevel.Orb,
  });

  if (finalPayload.status === "error") {
    const errorCode = (finalPayload as any).error_code;
    if (errorCode === "limit_reached") {
      throw new Error("You've reached your limit for this action. Please try again later.");
    }
    throw new Error("Verification was rejected. Please try again.");
  }

  const r = await fetchWithTimeout(
    "/api/verify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload: finalPayload as ISuccessResult,
        action,
        signal,
      }),
    },
    FETCH_TIMEOUT_WRITE_MS
  );

  const j = await r.json();
  if (r.status !== 200) {
    const errorMessage = j.verifyRes?.error || j.message || "Verification failed. Please try again.";
    throw new Error(errorMessage);
  }
  
  return finalPayload as ISuccessResult;
}
