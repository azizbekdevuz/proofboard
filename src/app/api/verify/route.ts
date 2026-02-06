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
  if (!app_id) {
    console.error('APP_ID not configured');
    return NextResponse.json(
      { error: 'APP_ID not configured', verifyRes: { success: false } },
      { status: 500 }
    );
  }

  if (!action) {
    console.error('Action not provided in request');
    return NextResponse.json(
      { error: 'Action required', verifyRes: { success: false } },
      { status: 400 }
    );
  }

  // According to World Mini App docs:
  // - Signal MUST match between proof generation and verification
  // - If signal was used during proof generation, it MUST be passed to verifyCloudProof
  // - verifyCloudProof signature: verifyCloudProof(payload, app_id, action, signal)
  
  // Normalize signal: pass undefined if empty, otherwise pass the signal value
  const signalParam = signal && signal.trim().length > 0 ? signal : undefined;

  // Log payload structure for debugging (without sensitive data)
  console.log('Verifying proof:', {
    action,
    signal: signalParam || '(none)',
    app_id: app_id.substring(0, 10) + '...',
    payloadKeys: Object.keys(payload || {}),
    payloadStatus: (payload as any)?.status,
    hasProof: !!(payload as any)?.proof,
    hasNullifier: !!(payload as any)?.nullifier_hash,
    merkleRoot: (payload as any)?.merkle_root ? 'present' : 'missing',
    proof: (payload as any)?.proof ? 'present' : 'missing',
  });
  
  let verifyRes: IVerifyResponse;
  try {
    // Pass signal to verifyCloudProof - it MUST match what was used during proof generation
    verifyRes = (await verifyCloudProof(
      payload,
      app_id,
      action,
      signalParam // Pass signal if it was used during proof generation
    )) as IVerifyResponse;
  } catch (error: any) {
    console.error('verifyCloudProof threw an error:', error);
    return NextResponse.json(
      {
        verifyRes: {
          success: false,
          error: "invalid_proof",
          message: error?.message || "Proof verification failed",
        },
      },
      { status: 400 }
    );
  }

  if (!verifyRes.success) {
    const errorCode = (verifyRes as any).code || (verifyRes as any).error_code;
    const errorDetail = (verifyRes as any).detail || (verifyRes as any).error_message || (verifyRes as any).error;
    
    console.error('Verification failed:', {
      success: verifyRes.success,
      errorCode,
      errorDetail,
      fullResponse: verifyRes,
    });

    // Handle max_verifications_reached with a helpful message
    if (errorCode === 'max_verifications_reached') {
      return NextResponse.json({
        verifyRes: {
          success: false,
          error: 'max_verifications_reached',
          error_code: 'max_verifications_reached',
          error_message: 'You have reached the maximum number of verifications for this action. Please check your action limits in the World Dev Portal or try again later.',
        },
      }, { status: 400 });
    }

    return NextResponse.json({ verifyRes }, { status: 400 });
  }

  console.log('Verification successful - proof is valid');

  // NOTE: We do NOT store the nullifier here anymore
  // Nullifier storage moved to action routes (/api/questions, /api/answers, /api/accept)
  // This ensures we only consume verification attempts when the actual action succeeds
  // Anti-replay protection happens atomically with the DB write in action routes

  return NextResponse.json({ 
    success: true,
    verifyRes,
    nullifier: (verifyRes as any).nullifier_hash ?? payload.nullifier_hash,
  }, { status: 200 });
}