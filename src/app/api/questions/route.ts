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

  const questions = await db.question.findMany({
    where: { categoryId },
    include: {
      user: { select: { username: true, wallet: true } },
      answers: {
        include: { user: { select: { username: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { answers: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(questions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.walletAddress) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { categoryId, text, proof } = await req.json();

  if (!categoryId || !text) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (text.length > 300) {
    return NextResponse.json({ error: "too_long" }, { status: 400 });
  }

  // Verify World ID proof (required for posting questions)
  if (!proof) {
    return NextResponse.json(
      { error: "verification_required", message: "World ID verification required to post questions" },
      { status: 403 }
    );
  }

  const action = process.env.NEXT_PUBLIC_ACTION_POST_QUESTION;
  if (!action) {
    return NextResponse.json({ error: "server_error", message: "Action ID not configured" }, { status: 500 });
  }

  const app_id = process.env.APP_ID as `app_${string}`;
  if (!app_id) {
    return NextResponse.json({ error: "server_error", message: "APP_ID not configured" }, { status: 500 });
  }

  // Verify the proof server-side
  const verifyRes = (await verifyCloudProof(
    proof as ISuccessResult,
    app_id,
    action,
    categoryId // Use categoryId as signal
  )) as IVerifyResponse;

  if (!verifyRes.success) {
    const errorMessage = (verifyRes as any).error || "World ID verification failed. You may have reached your limit or the proof is invalid.";
    return NextResponse.json(
      {
        error: "verification_failed",
        message: errorMessage,
      },
      { status: 400 }
    );
  }

  // Anti-replay: check if nullifier was already used
  const nullifier = (verifyRes as any).nullifier_hash ?? (proof as ISuccessResult).nullifier_hash;
  const existingProof = await db.actionProof.findFirst({
    where: {
      action,
      nullifier,
    },
  });

  if (existingProof) {
    return NextResponse.json(
      {
        error: "already_used",
        message: "This verification has already been used. Please verify again.",
      },
      { status: 400 }
    );
  }

  // Store the proof to prevent replay
  try {
    await db.actionProof.create({ data: { action, nullifier } });
  } catch (error) {
    // Race condition: another request used this proof
    return NextResponse.json(
      {
        error: "already_used",
        message: "This verification has already been used.",
      },
      { status: 400 }
    );
  }

  // Create the question
  const wallet = session.user.walletAddress;
  const username = session.user.username || null;

  const user = await db.user.upsert({
    where: { wallet },
    update: { username },
    create: { wallet, username },
  });

  const q = await db.question.create({
    data: { userId: user.id, categoryId, text },
    include: {
      user: { select: { username: true, wallet: true } },
    },
  });

  return NextResponse.json(q);
}
