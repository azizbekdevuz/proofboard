import { NextRequest, NextResponse } from "next/server";
import { verifyCloudProof, IVerifyResponse, ISuccessResult } from "@worldcoin/minikit-js";
import { db } from "@/lib/db";

type Req = {
  payload: ISuccessResult;
  action: string;
  signal?: string;
};

export async function POST(req: NextRequest) {
  const { payload, action, signal } = (await req.json()) as Req;

  const app_id = process.env.APP_ID as `app_${string}`;
  const verifyRes = (await verifyCloudProof(payload, app_id, action, signal)) as IVerifyResponse;

  if (!verifyRes.success) {
    return NextResponse.json({ verifyRes }, { status: 400 });
  }

  // Anti-replay: store nullifier_hash per action
  // World verify endpoint enforces per-action limits; you also persist to avoid your own double-processing.
  const nullifier = (verifyRes as any).nullifier_hash ?? payload.nullifier_hash; // depending on wrapper response
  try {
    await db.actionProof.create({ data: { action, nullifier } });
  } catch {
    return NextResponse.json({ verifyRes: { success: false, error: "replay" } }, { status: 400 });
  }

  return NextResponse.json({ verifyRes }, { status: 200 });
}