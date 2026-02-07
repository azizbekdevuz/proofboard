import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { verifyCloudProof, IVerifyResponse, ISuccessResult } from "@worldcoin/minikit-js";
import { getActionViewNote } from "@/lib/worldActions";

/**
 * POST /api/notes/:id/view
 * Record a view on a note (question or answer)
 * 
 * Strategy:
 * - One view per human per note per day (using day bucket)
 * - Signal: noteId:YYYY-MM-DD
 * - Prevents refresh spam and bot views
 * - Increments viewCount only on first view of the day
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: noteId } = await params;
  const requestId = req.headers.get('x-rid') || 'unknown';
  
  console.log(`[${requestId}] POST /api/notes/${noteId}/view`);

  // 1. Auth check
  const session = await auth();
  const wallet = session?.user?.walletAddress;

  if (!wallet) {
    return NextResponse.json({ 
      error: "unauthorized",
      message: "Authentication required. Please sign in with World App.",
    }, { status: 401 });
  }

  // 2. Get user
  const user = await db.user.findUnique({
    where: { wallet },
  });

  if (!user) {
    return NextResponse.json({ 
      error: "unauthorized",
      message: "User not found",
    }, { status: 401 });
  }

  // 3. Check if note exists and is not deleted
  const note = await db.note.findUnique({
    where: { id: noteId },
    select: { id: true, deletedAt: true, viewCount: true },
  });

  if (!note || note.deletedAt) {
    return NextResponse.json({ 
      error: "not_found",
      message: "Note not found or has been deleted",
    }, { status: 404 });
  }

  // 4. Get request body
  const body = await req.json();
  const { proof, signal } = body;

  if (!proof || !signal) {
    return NextResponse.json({
      error: "bad_request",
      message: "Missing proof or signal",
      missing: { proof: !proof, signal: !signal },
    }, { status: 400 });
  }

  // 5. Validate signal format (should be noteId:YYYY-MM-DD)
  const signalParts = signal.split(':');
  if (signalParts.length !== 2 || signalParts[0] !== noteId) {
    return NextResponse.json({
      error: "bad_request",
      message: "Signal must be in format noteId:YYYY-MM-DD",
    }, { status: 400 });
  }

  const dayBucket = signalParts[1]; // YYYY-MM-DD
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayBucket)) {
    return NextResponse.json({
      error: "bad_request",
      message: "Invalid date format in signal. Expected YYYY-MM-DD",
    }, { status: 400 });
  }

  // 6. Get action ID
  let action: string;
  try {
    action = getActionViewNote();
  } catch (error: any) {
    console.error(`[${requestId}] Action ID not configured:`, error);
    return NextResponse.json({
      error: "server_error",
      message: error.message,
    }, { status: 500 });
  }

  const app_id = process.env.APP_ID as `app_${string}`;
  if (!app_id) {
    console.error(`[${requestId}] APP_ID not configured`);
    return NextResponse.json({
      error: "server_error",
      message: "APP_ID not configured",
    }, { status: 500 });
  }

  // 7. Verify proof
  console.log(`[${requestId}] Verifying proof for view:`, {
    action,
    signal,
    dayBucket,
    hasNullifier: !!(proof as ISuccessResult).nullifier_hash,
  });

  let verifyRes: IVerifyResponse;
  try {
    verifyRes = (await verifyCloudProof(
      proof as ISuccessResult,
      app_id,
      action,
      signal
    )) as IVerifyResponse;
  } catch (error: any) {
    console.error(`[${requestId}] verifyCloudProof error:`, error);
    return NextResponse.json({
      error: "verification_failed",
      message: error?.message || "Proof verification failed",
    }, { status: 400 });
  }

  if (!verifyRes.success) {
    const errorCode = (verifyRes as any).code || (verifyRes as any).error_code;
    console.error(`[${requestId}] Verification failed:`, { errorCode, verifyRes });
    return NextResponse.json({
      error: "verification_failed",
      code: errorCode,
      message: (verifyRes as any).detail || "World ID verification failed",
    }, { status: 400 });
  }

  // 8. Extract nullifier
  const nullifier = (verifyRes as any).nullifier_hash ?? (proof as ISuccessResult).nullifier_hash;
  if (!nullifier) {
    console.error(`[${requestId}] Nullifier missing`);
    return NextResponse.json({
      error: "invalid_proof",
      message: "Proof missing nullifier hash",
    }, { status: 400 });
  }

  console.log(`[${requestId}] Verification successful, nullifier:`, nullifier);

  // 9. Atomic transaction: store nullifier + record view + increment count
  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Store ActionProof (anti-replay)
      try {
        await tx.actionProof.create({
          data: { action, nullifier, signal },
        });
        console.log(`[${requestId}] ActionProof stored:`, { action, nullifier, signal });
      } catch (error: any) {
        if (error.code === 'P2002') {
          // Unique constraint violation = already viewed this note today
          throw new Error('ALREADY_VIEWED');
        }
        throw error;
      }

      // 2. Create view record
      await tx.noteView.create({
        data: {
          noteId,
          userId: user.id,
          dayBucket,
        },
      });

      // 3. Increment count
      const updated = await tx.note.update({
        where: { id: noteId },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      });

      return updated;
    });

    console.log(`[${requestId}] View recorded: noteId=${noteId}, userId=${user.id}, dayBucket=${dayBucket}`);
    return NextResponse.json({
      viewed: true,
      viewCount: result.viewCount,
    });
  } catch (error: any) {
    if (error.message === 'ALREADY_VIEWED') {
      console.log(`[${requestId}] Already viewed today:`, { action, nullifier, signal });
      // Return success but don't increment (idempotent)
      return NextResponse.json({
        viewed: true,
        viewCount: note.viewCount,
        message: "Already viewed today",
      });
    }

    console.error(`[${requestId}] Transaction failed:`, error);
    return NextResponse.json({
      error: "server_error",
      message: "Failed to record view",
      details: error.message,
    }, { status: 500 });
  }
}
