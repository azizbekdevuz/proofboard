import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import {
  verifyCloudProof,
  IVerifyResponse,
  ISuccessResult,
} from "@worldcoin/minikit-js";
import {
  addAnswer,
  getAnswersForQuestion,
  getNoteById,
  isFakeDataEnabled,
} from "@/lib/fake-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get("questionId");

  if (!questionId) {
    return NextResponse.json({ error: "questionId required" }, { status: 400 });
  }

  if (isFakeDataEnabled()) {
    return NextResponse.json(getAnswersForQuestion(questionId));
  }

  const answers = await db.note.findMany({
    where: { type: "ANSWER", referenceId: questionId },
    include: {
      user: { select: { username: true, wallet: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(answers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.walletAddress) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { questionId, text, proof } = await req.json();

  if (isFakeDataEnabled()) {
    if (!questionId || !text) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    if (text.length > 500) {
      return NextResponse.json({ error: "too_long" }, { status: 400 });
    }
    const a = addAnswer({
      questionId,
      text: text.trim(),
      wallet: session.user.walletAddress,
      username: session.user.username ?? null,
    });
    if (!a) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(a);
  }

  if (!questionId || !text) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (text.length > 500) {
    return NextResponse.json({ error: "too_long" }, { status: 400 });
  }

  // Verify World ID proof (required for posting answers)
  if (!proof) {
    return NextResponse.json(
      {
        error: "verification_required",
        message: "World ID verification required to post answers",
      },
      { status: 403 }
    );
  }

  const action = process.env.NEXT_PUBLIC_ACTION_POST_ANSWER;
  if (!action) {
    return NextResponse.json(
      { error: "server_error", message: "Action ID not configured" },
      { status: 500 }
    );
  }

  const app_id = process.env.APP_ID as `app_${string}`;
  if (!app_id) {
    return NextResponse.json(
      { error: "server_error", message: "APP_ID not configured" },
      { status: 500 }
    );
  }

  const verifyRes = (await verifyCloudProof(
    proof as ISuccessResult,
    app_id,
    action,
    questionId
  )) as IVerifyResponse;

  if (!verifyRes.success) {
    const errorMessage =
      (verifyRes as any).error || "World ID verification failed.";
    return NextResponse.json(
      { error: "verification_failed", message: errorMessage },
      { status: 400 }
    );
  }

  const nullifier =
    (verifyRes as any).nullifier_hash ??
    (proof as ISuccessResult).nullifier_hash;
  const existingProof = await db.actionProof.findFirst({
    where: { action, nullifier },
  });

  if (existingProof) {
    return NextResponse.json(
      {
        error: "already_used",
        message: "This verification has already been used.",
      },
      { status: 400 }
    );
  }

  try {
    await db.actionProof.create({ data: { action, nullifier } });
  } catch {
    return NextResponse.json(
      {
        error: "already_used",
        message: "This verification has already been used.",
      },
      { status: 400 }
    );
  }

  const questionNote = await db.note.findUnique({
    where: { id: questionId },
  });
  if (!questionNote || questionNote.type !== "QUESTION") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const wallet = session.user.walletAddress;
  const username = session.user.username || null;

  const user = await db.user.upsert({
    where: { wallet },
    update: { username },
    create: { wallet, username },
  });

  const answerNote = await db.note.create({
    data: {
      userId: user.id,
      category: questionNote.category,
      type: "ANSWER",
      referenceId: questionId,
      text,
    },
    include: {
      user: { select: { username: true, wallet: true } },
    },
  });

  // Bump the question's answersNum
  await db.note.update({
    where: { id: questionId },
    data: { answersNum: { increment: 1 } },
  });

  return NextResponse.json(answerNote);
}
