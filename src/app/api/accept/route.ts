import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { verifyCloudProof, ISuccessResult } from "@worldcoin/minikit-js";
import type { VerifyResponseWithDetails } from "@/lib/types";
import {
  getNoteById,
  acceptAnswerFake,
  isFakeDataEnabled,
} from "@/lib/fake-data";
import { getNoteByIdWithUser, acceptAnswer } from "@/lib/notes-sql";
import { getVerifyHeaders } from "@/lib/verify-server";

export async function POST(req: NextRequest) {
  const log = (msg: string, data?: object) =>
    console.error("[POST /api/accept]", msg, data ?? "");

  const session = await auth();
  if (!session?.user?.walletAddress) {
    log("unauthorized");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { questionId?: string; answerId?: string; proof?: unknown };
  try {
    body = await req.json();
  } catch (parseErr) {
    log("req.json() failed", {
      error: parseErr instanceof Error ? parseErr.message : String(parseErr),
    });
    return NextResponse.json(
      { error: "bad_request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const { questionId, answerId, proof } = body;
  log("body parsed", {
    questionId: questionId ?? null,
    answerId: answerId ?? null,
    hasProof: Boolean(proof),
  });

  if (!questionId || !answerId) {
    log("400 bad_request", { questionId: !!questionId, answerId: !!answerId });
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (isFakeDataEnabled()) {
    const q = getNoteById(questionId);
    if (!q || q.type !== "QUESTION") {
      log("404 question not found (fake)", { questionId });
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (q.user.wallet !== session.user.walletAddress) {
      log("403 forbidden - not question owner (fake)");
      return NextResponse.json(
        {
          error: "forbidden",
          message: "Only the question owner can accept answers",
        },
        { status: 403 }
      );
    }
    if (q.acceptedAnswerId !== "") {
      log("400 already_accepted (fake)");
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
      log("404 acceptAnswerFake false (fake)", { questionId, answerId });
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ accepted: true, acceptedAnswerId: answerId });
  }

  if (!proof) {
    log("403 verification_required");
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
    log("500 Action ID not configured");
    return NextResponse.json(
      { error: "server_error", message: "Action ID not configured" },
      { status: 500 }
    );
  }

  const app_id = process.env.NEXT_PUBLIC_APP_ID as `app_${string}`;
  if (!app_id) {
    log("500 NEXT_PUBLIC_APP_ID missing");
    return NextResponse.json(
      { error: "server_error", message: "NEXT_PUBLIC_APP_ID not configured" },
      { status: 500 }
    );
  }

  log("calling verifyCloudProof", { action, signal: questionId });
  let verifyRes: VerifyResponseWithDetails;
  try {
    verifyRes = (await verifyCloudProof(
      proof as ISuccessResult,
      app_id,
      action,
      questionId,
      undefined,
      getVerifyHeaders()
    )) as VerifyResponseWithDetails;
  } catch (verifyErr) {
    log("verifyCloudProof threw", {
      error: verifyErr instanceof Error ? verifyErr.message : String(verifyErr),
      stack: verifyErr instanceof Error ? verifyErr.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "verification_error",
        message:
          verifyErr instanceof Error
            ? verifyErr.message
            : "Verification request failed",
      },
      { status: 400 }
    );
  }

  if (!verifyRes.success) {
    log("400 World ID verify failed", {
      code: (verifyRes as { code?: string }).code,
      error: (verifyRes as { error?: string }).error,
      detail: (verifyRes as { detail?: string }).detail,
      full: JSON.stringify(verifyRes),
    });
    const errorMessage =
      (verifyRes as { error?: string }).error ||
      "World ID verification failed.";
    return NextResponse.json(
      { error: "verification_failed", message: errorMessage },
      { status: 400 }
    );
  }

  const nullifier =
    verifyRes.nullifier_hash ?? (proof as ISuccessResult).nullifier_hash;
  const existingProof = await db.actionProof.findFirst({
    where: { action, nullifier },
  });

  if (existingProof) {
    log("400 already_used", { action });
    return NextResponse.json(
      {
        error: "already_used",
        message:
          "The verification has already been used. Please try to verify again.",
      },
      { status: 400 }
    );
  }

  try {
    await db.actionProof.create({ data: { action, nullifier } });
  } catch (dbErr) {
    log("400 ActionProof.create failed", {
      error: dbErr instanceof Error ? dbErr.message : String(dbErr),
    });
    return NextResponse.json(
      {
        error: "already_used",
        message:
          "The verification has already been used. Please try to verify again.",
      },
      { status: 400 }
    );
  }

  const wallet = session.user.walletAddress;

  const q = await getNoteByIdWithUser(questionId);
  if (!q || q.type !== "QUESTION") {
    log("404 question not found", { questionId });
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (q.user_wallet !== wallet) {
    log("403 forbidden - not question owner");
    return NextResponse.json(
      {
        error: "forbidden",
        message: "Only the question owner can accept answers",
      },
      { status: 403 }
    );
  }
  if (q.acceptedAnswerId !== "") {
    log("400 already_accepted");
    return NextResponse.json(
      {
        error: "already_accepted",
        message: "This question already has an accepted answer",
      },
      { status: 400 }
    );
  }

  const answer = await getNoteByIdWithUser(answerId);
  if (
    !answer ||
    answer.type !== "ANSWER" ||
    answer.referenceId !== questionId
  ) {
    log("404 answer not found or wrong question", { answerId, questionId });
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updated = await acceptAnswer(questionId, answerId);
  if (updated === 0) {
    log("404 acceptAnswer returned 0");
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ accepted: true, acceptedAnswerId: answerId });
}
