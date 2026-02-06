import { MiniKit, WalletAuthInput } from "@worldcoin/minikit-js";

export async function walletLogin() {
  if (!MiniKit.isInstalled()) return;

  const res = await fetch("/api/nonce");
  const { nonce } = await res.json();

  const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
    nonce,
    requestId: "0",
    expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000),
    statement: "ProofBoard login",
  } satisfies WalletAuthInput);

  if (finalPayload.status === "error") return;

  // Optional: send to backend (docs pattern)
  await fetch("/api/complete-siwe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload: finalPayload, nonce }),
  });
}
