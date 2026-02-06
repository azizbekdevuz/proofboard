import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { verifyCloudProof, IVerifyResponse, ISuccessResult } from "@worldcoin/minikit-js";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get("questionId");

  if (!questionId) {
    return NextResponse.json({ error: "questionId required" }, { status: 400 });
  }

  const answers = await db.answer.findMany({
    where: { questionId },
    include: {
      user: { select: { username: true, wallet: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(answers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const wallet = session?.user?.walletAddress;

  console.log('CREATE_ANSWER request:', {
    hasSession: !!session,
    wallet: wallet || '(missing)',
  });

  if (!wallet) {
    return NextResponse.json({ 
      error: "unauthorized",
      message: "Authentication required. Please sign in with World App.",
    }, { status: 401 });
  }

  const body = await req.json();
  const { questionId, text, proof, signal } = body;

  console.log('CREATE_ANSWER body:', {
    hasQuestionId: !!questionId,
    hasText: !!text,
    textLength: text?.length || 0,
    hasProof: !!proof,
    hasSignal: !!signal,
  });

  // Validate required fields
  const missing: Record<string, boolean> = {};
  if (!questionId) missing.questionId = true;
  if (!text) missing.text = true;
  if (!proof) missing.proof = true;
  if (!signal) missing.signal = true;

  if (Object.keys(missing).length > 0) {
    return NextResponse.json({ 
      error: "bad_request",
      message: "Missing required fields",
      missing,
    }, { status: 400 });
  }

  // Validate signal is non-empty string
  if (typeof signal !== 'string' || signal.trim().length === 0) {
    return NextResponse.json({
      error: "missing_signal",
      message: "Signal must be a non-empty string",
    }, { status: 400 });
  }

  if (text.length > 300) {
    return NextResponse.json({ 
      error: "too_long",
      message: "Answer must be 300 characters or less",
      length: text.length,
    }, { status: 400 });
  }

  // Get action ID
  const action = process.env.NEXT_PUBLIC_ACTION_POST_ANSWER;
  if (!action) {
    console.error('ACTION_POST_ANSWER not configured');
    return NextResponse.json({ 
      error: "server_error",
      message: "Action ID not configured"
    }, { status: 500 });
  }

  const app_id = process.env.APP_ID as `app_${string}`;
  if (!app_id) {
    console.error('APP_ID not configured');
    return NextResponse.json({ 
      error: "server_error",
      message: "APP_ID not configured"
    }, { status: 500 });
  }

  // Verify the proof server-side
  const signalParam = signal && signal.trim().length > 0 ? signal : undefined;
  
  console.log('Verifying proof for answer:', {
    action,
    signal: signalParam || '(none)',
    hasNullifier: !!(proof as ISuccessResult).nullifier_hash,
  });

  let verifyRes: IVerifyResponse;
  try {
    verifyRes = (await verifyCloudProof(
      proof as ISuccessResult,
      app_id,
      action,
      signalParam
    )) as IVerifyResponse;
  } catch (error: any) {
    console.error('verifyCloudProof error:', error);
    return NextResponse.json({
      error: "verification_failed",
      message: error?.message || "Proof verification failed",
    }, { status: 400 });
  }

  if (!verifyRes.success) {
    const errorCode = (verifyRes as any).code || (verifyRes as any).error_code;
    console.error('Verification failed:', { errorCode, verifyRes });
    return NextResponse.json({
      error: "verification_failed",
      code: errorCode,
      message: (verifyRes as any).detail || "World ID verification failed",
    }, { status: 400 });
  }

  // Extract nullifier
  const nullifier = (verifyRes as any).nullifier_hash ?? (proof as ISuccessResult).nullifier_hash;
  if (!nullifier) {
    console.error('Nullifier missing from verification response');
    return NextResponse.json({
      error: "invalid_proof",
      message: "Proof missing nullifier hash",
    }, { status: 400 });
  }

  console.log('Verification successful, nullifier:', nullifier);

  // Atomic transaction: store nullifier + create answer
  try {
    const username = session.user.username || null;

    const result = await db.$transaction(async (tx) => {
      // 1. Store nullifier (anti-replay protection)
      // Schema: @@unique([action, nullifier, signal])
      try {
        await tx.actionProof.create({
          data: { action, nullifier, signal },
        });
        console.log('ActionProof stored:', { action, nullifier, signal });
      } catch (error: any) {
        if (error.code === 'P2002') {
          // Unique constraint violation = replay for this specific (action, nullifier, signal)
          throw new Error('REPLAY_DETECTED');
        }
        throw error;
      }

      // 2. Upsert user
      const user = await tx.user.upsert({
        where: { wallet },
        update: { username },
        create: { wallet, username },
      });

      // 3. Create answer
      const answer = await tx.answer.create({
        data: { userId: user.id, questionId, text },
        include: {
          user: { select: { username: true, wallet: true } },
        },
      });

      return answer;
    });

    console.log('Answer created successfully:', result.id);
    return NextResponse.json(result);

  } catch (error: any) {
    if (error.message === 'REPLAY_DETECTED') {
      console.warn('Replay attempt detected:', { action, nullifier, signal });
      return NextResponse.json({
        error: "replay_or_already_used",
        message: "Already used for this question today. Please try again tomorrow.",
        action,
        signal,
      }, { status: 409 });
    }

    console.error('Transaction failed:', error);
    return NextResponse.json({
      error: "server_error",
      message: "Failed to create answer",
      details: error.message,
    }, { status: 500 });
  }
}
