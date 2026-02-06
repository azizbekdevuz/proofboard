"use client";

import { MiniKit, VerificationLevel, ISuccessResult } from "@worldcoin/minikit-js";

export async function verifyAndConsume(action: string, signal?: string) {
  if (!MiniKit.isInstalled()) throw new Error("Open inside World App");

  const { finalPayload } = await MiniKit.commandsAsync.verify({
    action,
    signal,
    verification_level: VerificationLevel.Orb,
  });

  if (finalPayload.status === "error") throw new Error("Verify rejected");

  const r = await fetch("/api/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      payload: finalPayload as ISuccessResult,
      action,
      signal,
    }),
  });

  const j = await r.json();
  if (j.status !== 200) throw new Error(j.verifyRes?.error ?? "Verify failed");
  return j.verifyRes;
}
