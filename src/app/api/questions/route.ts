import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { verifyCloudProof, IVerifyResponse, ISuccessResult } from "@worldcoin/minikit-js";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");

  if (!categoryId) {
    return NextResponse.json({ error: "categoryId required" }, { status: 400 });
  }

  const questions = await db.note.findMany({
    where: { 
      categoryId,
      type: 'QUESTION',
      deletedAt: null, // Exclude soft-deleted notes
    },
    include: {
      user: { select: { username: true, wallet: true } },
      children: {
        where: { deletedAt: null }, // Exclude soft-deleted answers
        include: { user: { select: { username: true, wallet: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { children: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Transform to match old API shape for backward compatibility
  const transformed = questions.map(q => ({
    id: q.id,
    categoryId: q.categoryId,
    userId: q.userId,
    text: q.text,
    createdAt: q.createdAt,
    acceptedId: q.acceptedAnswerId,
    user: q.user,
    answers: q.children.map(child => ({
      id: child.id,
      questionId: q.id,
      userId: child.userId,
      text: child.text,
      createdAt: child.createdAt,
      user: child.user,
    })),
    _count: { answers: q._count.children },
  }));

  return NextResponse.json(transformed);
}

export async function POST(req: NextRequest) {
  // Extract request ID for tracking
  const requestId = req.headers.get('x-rid') || 'unknown';
  
  const session = await auth();
  const wallet = session?.user?.walletAddress;

  console.log(`[${requestId}] CREATE_QUESTION request:`, {
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
  const { categoryId, text, proof, signal } = body;

  console.log(`[${requestId}] CREATE_QUESTION body:`, {
    hasCategoryId: !!categoryId,
    hasText: !!text,
    textLength: text?.length || 0,
    hasProof: !!proof,
    hasSignal: !!signal,
  });

  // Validate required fields
  const missing: Record<string, boolean> = {};
  if (!categoryId) missing.categoryId = true;
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
      message: "Question must be 300 characters or less",
      length: text.length,
    }, { status: 400 });
  }

  // Get action ID
  const action = process.env.NEXT_PUBLIC_ACTION_POST_QUESTION;
  if (!action) {
    console.error('ACTION_POST_QUESTION not configured');
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

  // Verify the proof server-side (signal must match what was used during generation)
  const signalParam = signal && signal.trim().length > 0 ? signal : undefined;
  
  console.log(`[${requestId}] Verifying proof for question:`, {
    action,
    signal: signalParam || '(none)',
    hasNullifier: !!(proof as ISuccessResult).nullifier_hash,
    nullifier: (proof as ISuccessResult).nullifier_hash,
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

  console.log(`[${requestId}] Verification successful, nullifier:`, nullifier);

  // Atomic transaction: store nullifier + create question
  // If either fails, both fail (no wasted verification attempts)
  try {
    const username = session.user.username || null;

    const result = await db.$transaction(async (tx) => {
      // 1. Store nullifier (anti-replay protection)
      // Schema: @@unique([action, nullifier, signal])
      try {
        await tx.actionProof.create({
          data: { action, nullifier, signal },
        });
        console.log(`[${requestId}] ActionProof stored:`, { action, nullifier, signal });
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

      // 3. Create question (as Note with type=QUESTION)
      const question = await tx.note.create({
        data: { 
          type: 'QUESTION',
          userId: user.id, 
          categoryId, 
          text,
        },
        include: {
          user: { select: { username: true, wallet: true } },
        },
      });

      // Transform to match old API shape for backward compatibility
      return {
        id: question.id,
        categoryId: question.categoryId,
        userId: question.userId,
        text: question.text,
        createdAt: question.createdAt,
        acceptedId: question.acceptedAnswerId,
        user: question.user,
        answers: [],
        _count: { answers: 0 },
      };
    });

    console.log(`[${requestId}] Question created successfully:`, result.id);
    return NextResponse.json(result);

  } catch (error: any) {
    if (error.message === 'REPLAY_DETECTED') {
      console.warn(`[${requestId}] Replay attempt detected:`, { action, nullifier, signal });
      return NextResponse.json({
        error: "replay_or_already_used",
        message: "Already used for this category today. Please try again tomorrow or use a different category.",
        action,
        signal,
      }, { status: 409 });
    }

    console.error(`[${requestId}] Transaction failed:`, error);
    return NextResponse.json({
      error: "server_error",
      message: "Failed to create question",
      details: error.message,
    }, { status: 500 });
  }
}
