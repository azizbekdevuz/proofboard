import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { verifyCloudProof, IVerifyResponse, ISuccessResult } from "@worldcoin/minikit-js";
import { getActionLikeNote } from "@/lib/worldActions";

/**
 * POST /api/notes/:id/like
 * Toggle like on a note (question or answer)
 * 
 * Strategy:
 * - If like exists: DELETE like, decrement count (no verify needed - reduces abuse)
 * - If like doesn't exist: VERIFY proof, CREATE like, increment count
 * 
 * This allows users to unlike without burning verification attempts.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: noteId } = await params;
  const requestId = req.headers.get('x-rid') || 'unknown';
  
  console.log(`[${requestId}] POST /api/notes/${noteId}/like`);

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
    select: { id: true, deletedAt: true, likeCount: true },
  });

  if (!note || note.deletedAt) {
    return NextResponse.json({ 
      error: "not_found",
      message: "Note not found or has been deleted",
    }, { status: 404 });
  }

  // 4. Check if like already exists
  const existingLike = await db.noteLike.findUnique({
    where: {
      noteId_userId: {
        noteId,
        userId: user.id,
      },
    },
  });

  // 5. TOGGLE LOGIC
  if (existingLike) {
    // UNLIKE: Remove like without verification (reduces abuse)
    try {
      const result = await db.$transaction(async (tx) => {
        // Delete like
        await tx.noteLike.delete({
          where: { id: existingLike.id },
        });

        // Decrement count
        const updated = await tx.note.update({
          where: { id: noteId },
          data: { likeCount: { decrement: 1 } },
          select: { likeCount: true },
        });

        return updated;
      });

      console.log(`[${requestId}] Unlike successful: noteId=${noteId}, userId=${user.id}`);
      return NextResponse.json({
        liked: false,
        likeCount: result.likeCount,
      });
    } catch (error: any) {
      console.error(`[${requestId}] Unlike failed:`, error);
      return NextResponse.json({
        error: "server_error",
        message: "Failed to unlike note",
      }, { status: 500 });
    }
  } else {
    // LIKE: Verify proof and create like
    const body = await req.json();
    const { proof, signal } = body;

    if (!proof || !signal) {
      return NextResponse.json({
        error: "bad_request",
        message: "Missing proof or signal",
        missing: { proof: !proof, signal: !signal },
      }, { status: 400 });
    }

    // Validate signal format (should be noteId)
    if (signal !== noteId) {
      return NextResponse.json({
        error: "bad_request",
        message: "Signal must match noteId",
      }, { status: 400 });
    }

    // Get action ID
    let action: string;
    try {
      action = getActionLikeNote();
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

    // Verify proof
    console.log(`[${requestId}] Verifying proof for like:`, {
      action,
      signal,
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

    // Extract nullifier
    const nullifier = (verifyRes as any).nullifier_hash ?? (proof as ISuccessResult).nullifier_hash;
    if (!nullifier) {
      console.error(`[${requestId}] Nullifier missing`);
      return NextResponse.json({
        error: "invalid_proof",
        message: "Proof missing nullifier hash",
      }, { status: 400 });
    }

    console.log(`[${requestId}] Verification successful, nullifier:`, nullifier);

    // Atomic transaction: store nullifier + create like + increment count
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
            // Unique constraint violation = already liked this note
            throw new Error('ALREADY_LIKED');
          }
          throw error;
        }

        // 2. Create like
        await tx.noteLike.create({
          data: {
            noteId,
            userId: user.id,
          },
        });

        // 3. Increment count
        const updated = await tx.note.update({
          where: { id: noteId },
          data: { likeCount: { increment: 1 } },
          select: { likeCount: true },
        });

        return updated;
      });

      console.log(`[${requestId}] Like successful: noteId=${noteId}, userId=${user.id}`);
      return NextResponse.json({
        liked: true,
        likeCount: result.likeCount,
      });
    } catch (error: any) {
      if (error.message === 'ALREADY_LIKED') {
        console.warn(`[${requestId}] Already liked:`, { action, nullifier, signal });
        return NextResponse.json({
          error: "replay_or_already_used",
          message: "You have already liked this note",
          action,
          signal,
        }, { status: 409 });
      }

      console.error(`[${requestId}] Transaction failed:`, error);
      return NextResponse.json({
        error: "server_error",
        message: "Failed to like note",
        details: error.message,
      }, { status: 500 });
    }
  }
}
