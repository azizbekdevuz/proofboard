import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { verifyCloudProof, IVerifyResponse, ISuccessResult } from "@worldcoin/minikit-js";

export async function POST(req: NextRequest) {
  const session = await auth();
  const wallet = session?.user?.walletAddress;

  console.log('ACCEPT_ANSWER request:', {
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
  const { questionId, answerId, proof, signal } = body;

  console.log('ACCEPT_ANSWER body:', {
    hasQuestionId: !!questionId,
    hasAnswerId: !!answerId,
    hasProof: !!proof,
    hasSignal: !!signal,
  });

  // Validate required fields
  const missing: Record<string, boolean> = {};
  if (!questionId) missing.questionId = true;
  if (!answerId) missing.answerId = true;
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

  // Get action ID
  const action = process.env.NEXT_PUBLIC_ACTION_ACCEPT_ANSWER;
  if (!action) {
    console.error('ACTION_ACCEPT_ANSWER not configured');
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
  
  console.log('Verifying proof for accept:', {
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

  // Check ownership first (before consuming verification attempt)
  const q = await db.note.findUnique({
    where: { id: questionId },
    include: { user: true },
  });
  
  if (!q || q.type !== 'QUESTION') {
    return NextResponse.json({ 
      error: "not_found",
      message: "Question not found",
    }, { status: 404 });
  }
  
  if (q.user.wallet !== wallet) {
    return NextResponse.json({
      error: "forbidden",
      message: "Only the question owner can accept answers",
    }, { status: 403 });
  }

  // Atomic transaction: store nullifier + accept answer
  try {
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

      // 2. Verify answer exists and is of type ANSWER
      const answer = await tx.note.findUnique({
        where: { id: answerId },
        select: { type: true, parentId: true },
      });

      if (!answer || answer.type !== 'ANSWER' || answer.parentId !== questionId) {
        throw new Error('INVALID_ANSWER');
      }

      // 3. Accept answer
      const updated = await tx.note.update({
        where: { id: questionId },
        data: { acceptedAnswerId: answerId },
        include: {
          user: { select: { username: true, wallet: true } },
          children: {
            where: { deletedAt: null },
            include: { user: { select: { username: true, wallet: true } } },
          },
        },
      });

      // Transform to match old API shape for backward compatibility
      return {
        id: updated.id,
        categoryId: updated.categoryId,
        userId: updated.userId,
        text: updated.text,
        createdAt: updated.createdAt,
        acceptedId: updated.acceptedAnswerId,
        user: updated.user,
        answers: updated.children.map(child => ({
          id: child.id,
          questionId: updated.id,
          userId: child.userId,
          text: child.text,
          createdAt: child.createdAt,
          user: child.user,
        })),
      };
    });

    console.log('Answer accepted successfully:', answerId);
    return NextResponse.json(result);

  } catch (error: any) {
    if (error.message === 'REPLAY_DETECTED') {
      console.warn('Replay attempt detected:', { action, nullifier, signal });
      return NextResponse.json({
        error: "replay_or_already_used",
        message: "Already accepted. This answer has already been accepted for this question.",
        action,
        signal,
      }, { status: 409 });
    }

    if (error.message === 'INVALID_ANSWER') {
      return NextResponse.json({
        error: "bad_request",
        message: "Invalid answer or answer does not belong to this question",
      }, { status: 400 });
    }

    console.error('Transaction failed:', error);
    return NextResponse.json({
      error: "server_error",
      message: "Failed to accept answer",
      details: error.message,
    }, { status: 500 });
  }
}
