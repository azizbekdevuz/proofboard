import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { verifyCloudProof, ISuccessResult } from "@worldcoin/minikit-js";
import type { VerifyResponseWithDetails } from "@/lib/types";
import {
  addAnswer,
  getAnswersForQuestion,
  isFakeDataEnabled,
  countUserAnswersForQuestionFake,
} from "@/lib/fake-data";
import {
  getQuestionById,
  createAnswer,
  incrementAnswersNum,
  getAnswersForQuestion as getAnswersForQuestionSql,
  toNoteApiResponse,
  countUserAnswersForQuestion,
} from "@/lib/notes-sql";
import { getVerifyHeaders } from "@/lib/verify-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get("questionId");

  if (!questionId) {
    return NextResponse.json({ error: "questionId required" }, { status: 400 });
  }

  if (isFakeDataEnabled()) {
    return NextResponse.json(getAnswersForQuestion(questionId));
  }

  const answers = await getAnswersForQuestionSql(questionId);
  return NextResponse.json(answers.map(toNoteApiResponse));
}

export async function POST(req: NextRequest) {
  const log = (msg: string, data?: object) =>
    console.error("[POST /api/answers]", msg, data ?? "");

  try {
    const session = await auth();
    if (!session?.user?.walletAddress) {
      log("unauthorized");
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    let body: { questionId?: string; text?: string; proof?: unknown };
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
    const { questionId, text, proof } = body;
    log("body parsed", {
      questionId: questionId ?? null,
      textLength: typeof text === "string" ? text.length : null,
      hasProof: Boolean(proof),
      proofKeys:
        proof && typeof proof === "object"
          ? Object.keys(proof as object)
          : null,
    });

    if (isFakeDataEnabled()) {
      if (!questionId || !text) {
        log("400 bad_request (fake)", {
          questionId: !!questionId,
          text: !!text,
        });
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
      }
      if (text.length > 500) {
        log("400 too_long (fake)", { textLength: text.length });
        return NextResponse.json({ error: "too_long" }, { status: 400 });
      }
      if (
        countUserAnswersForQuestionFake(
          questionId,
          session.user.walletAddress
        ) >= 3
      ) {
        log("400 answer_limit (fake)", { questionId });
        return NextResponse.json(
          {
            error: "answer_limit",
            message:
              "You can post up to 3 answers per question. You've reached the limit.",
          },
          { status: 400 }
        );
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
      log("400 bad_request", { questionId: !!questionId, text: !!text });
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    if (text.length > 500) {
      log("400 too_long", { textLength: text.length });
      return NextResponse.json({ error: "too_long" }, { status: 400 });
    }

    if (!proof) {
      log("missing proof");
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
      log("NEXT_PUBLIC_ACTION_POST_ANSWER missing");
      return NextResponse.json(
        { error: "server_error", message: "Action ID not configured" },
        { status: 500 }
      );
    }

    const app_id = process.env.NEXT_PUBLIC_APP_ID as `app_${string}`;
    if (!app_id) {
      log("NEXT_PUBLIC_APP_ID missing");
      return NextResponse.json(
        { error: "server_error", message: "NEXT_PUBLIC_APP_ID not configured" },
        { status: 500 }
      );
    }

    log("calling verifyCloudProof", {
      action,
      app_id: app_id.slice(0, 12) + "...",
      signal: questionId,
    });
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
        error:
          verifyErr instanceof Error ? verifyErr.message : String(verifyErr),
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
      log("World ID verify failed", {
        code: (verifyRes as { code?: string }).code,
        error: (verifyRes as { error?: string }).error,
        detail: (verifyRes as { detail?: string }).detail,
        full: JSON.stringify(verifyRes),
      });
      const errorMessage =
        (verifyRes as { error?: string }).error ||
        (verifyRes as { message?: string }).message ||
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
      log("proof already used", { action });
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
      log("ActionProof.create failed", {
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

    const questionNote = await getQuestionById(questionId);
    if (!questionNote) {
      log("question not found", { questionId });
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const wallet = session.user.walletAddress;
    const username = session.user.username || null;

    const user = await db.user.upsert({
      where: { wallet },
      update: { username },
      create: { wallet, username },
    });

    const existingCount = await countUserAnswersForQuestion(
      questionId,
      user.id
    );
    if (existingCount >= 3) {
      log("answer limit reached", {
        questionId,
        userId: user.id,
        count: existingCount,
      });
      return NextResponse.json(
        {
          error: "answer_limit",
          message:
            "You can post up to 3 answers per question. You've reached the limit.",
        },
        { status: 400 }
      );
    }

    const answerNote = await createAnswer({
      userId: user.id,
      questionId,
      category: questionNote.category,
      text,
    });
    if (!answerNote) {
      log("createAnswer returned null");
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    await incrementAnswersNum(questionId);

    return NextResponse.json(toNoteApiResponse(answerNote));
  } catch (err) {
    log("unhandled error", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "server_error",
        message: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
