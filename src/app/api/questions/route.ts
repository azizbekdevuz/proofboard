import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { verifyCloudProof, ISuccessResult } from "@worldcoin/minikit-js";
import type { VerifyResponseWithDetails } from "@/lib/types";
import {
  getBoardQuestions,
  getArchiveQuestions,
  addQuestion,
  isFakeDataEnabled,
} from "@/lib/fake-data";
import {
  getBoardQuestions as getBoardQuestionsSql,
  getArchiveQuestions as getArchiveQuestionsSql,
  createQuestion,
  toNoteApiResponse,
} from "@/lib/notes-sql";

/**
 * GET /api/questions
 * Returns board questions (no accepted answer) by default.
 * ?archive=true returns past/completed questions (sorted by likes DESC).
 * Uses raw SQL for notes.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const archive = searchParams.get("archive") === "true";

  if (isFakeDataEnabled()) {
    if (archive) {
      return NextResponse.json(getArchiveQuestions(categoryId ?? null));
    }
    return NextResponse.json(getBoardQuestions(categoryId ?? null));
  }

  if (archive) {
    const notes = await getArchiveQuestionsSql(categoryId ?? null);
    return NextResponse.json(notes.map(toNoteApiResponse));
  }

  const notes = await getBoardQuestionsSql(categoryId ?? null);
  return NextResponse.json(notes.map(toNoteApiResponse));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.walletAddress) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { categoryId, text, proof } = await req.json();

  if (isFakeDataEnabled()) {
    if (!categoryId || !text) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    if (text.length > 300) {
      return NextResponse.json({ error: "too_long" }, { status: 400 });
    }
    const q = addQuestion({
      category: categoryId,
      text: text.trim(),
      wallet: session.user.walletAddress,
      username: session.user.username ?? null,
    });
    return NextResponse.json(q);
  }

  if (!categoryId || !text) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (text.length > 300) {
    return NextResponse.json({ error: "too_long" }, { status: 400 });
  }

  // World ID verification required for posting questions
  if (!proof) {
    return NextResponse.json(
      {
        error: "verification_required",
        message: "World ID verification required to post questions",
      },
      { status: 403 }
    );
  }

  const action = process.env.NEXT_PUBLIC_ACTION_POST_QUESTION;
  if (!action) {
    return NextResponse.json(
      {
        error: "server_error",
        message:
          "Action ID not configured. Set NEXT_PUBLIC_ACTION_POST_QUESTION in .env.local (see .env.sample).",
      },
      { status: 500 }
    );
  }

  const app_id = process.env.APP_ID as `app_${string}`;
  if (!app_id) {
    return NextResponse.json(
      {
        error: "server_error",
        message:
          "APP_ID not configured. Set APP_ID in .env.local (see .env.sample).",
      },
      { status: 500 }
    );
  }

  const verifyRes = (await verifyCloudProof(
    proof as ISuccessResult,
    app_id,
    action,
    categoryId
  )) as VerifyResponseWithDetails;

  if (!verifyRes.success) {
    const errorMessage =
      verifyRes.error || verifyRes.message || "World ID verification failed.";
    const errorCode = verifyRes.code ?? "verification_failed";
    return NextResponse.json(
      { error: errorCode, message: errorMessage },
      { status: 400 }
    );
  }

  const nullifier =
    verifyRes.nullifier_hash ?? (proof as ISuccessResult).nullifier_hash;
  const existingProof = await db.actionProof.findFirst({
    where: { action, nullifier },
  });

  if (existingProof) {
    return NextResponse.json(
      {
        error: "already_used",
        message:
          "This verification has already been used. Please verify again.",
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

  const wallet = session.user.walletAddress;
  const username = session.user.username || null;

  const user = await db.user.upsert({
    where: { wallet },
    update: { username },
    create: { wallet, username },
  });

  const note = await createQuestion({
    userId: user.id,
    category: categoryId,
    text,
  });
  if (!note) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json(toNoteApiResponse(note));
}
