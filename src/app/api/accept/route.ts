import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import {
  verifyCloudProof,
  IVerifyResponse,
  ISuccessResult,
} from "@worldcoin/minikit-js";
import {
  getNoteById,
  acceptAnswerFake,
  isFakeDataEnabled,
} from "@/lib/fake-data";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.walletAddress) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { questionId, answerId, proof } = await req.json();
  if (!questionId || !answerId) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (isFakeDataEnabled()) {
    const q = getNoteById(questionId);
    if (!q || q.type !== "QUESTION") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (q.user.wallet !== session.user.walletAddress) {
      return NextResponse.json(
        {
          error: "forbidden",
          message: "Only the question owner can accept answers",
        },
        { status: 403 }
      );
    }
    if (q.acceptedAnswerId !== "") {
      return NextResponse.json(
        {
          error: "already_accepted",
          message: "This question already has an accepted answer",
        },
        { status: 400 }
      );
    }
    const ok = acceptAnswerFake(questionId, answerId);
    if (!ok) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ accepted: true, acceptedAnswerId: answerId });
  }

  // Verify World ID proof (required for accepting answers)
  if (!proof) {
    return NextResponse.json(
      {
        error: "verification_required",
        message: "World ID verification required to accept answers",
      },
      { status: 403 }
    );
  }

  const action = process.env.NEXT_PUBLIC_ACTION_ACCEPT_ANSWER;
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

  // Check ownership and that no answer is already accepted
  const wallet = session.user.walletAddress;

  const q = await db.note.findUnique({
    where: { id: questionId },
    include: { user: true },
  });
  if (!q || q.type !== "QUESTION") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (q.user.wallet !== wallet) {
    return NextResponse.json(
      {
        error: "forbidden",
        message: "Only the question owner can accept answers",
      },
      { status: 403 }
    );
  }
  if (q.acceptedAnswerId !== "") {
    return NextResponse.json(
      {
        error: "already_accepted",
        message: "This question already has an accepted answer",
      },
      { status: 400 }
    );
  }

  // Verify the answer exists and belongs to this question
  const answer = await db.note.findUnique({ where: { id: answerId } });
  if (
    !answer ||
    answer.type !== "ANSWER" ||
    answer.referenceId !== questionId
  ) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Set the accepted answer
  await db.note.update({
    where: { id: questionId },
    data: { acceptedAnswerId: answerId },
  });

  return NextResponse.json({ accepted: true, acceptedAnswerId: answerId });
}
