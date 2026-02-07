import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { archiveQuestionFake, getNoteById, isFakeDataEnabled } from "@/lib/fake-data";
import { getNoteByIdWithUser, archiveQuestion } from "@/lib/notes-sql";

/**
 * POST /api/archive
 * Archive a question (real SQL). Only the owner can archive their own questions.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.walletAddress) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { questionId } = await req.json();
  if (!questionId) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (isFakeDataEnabled()) {
    const q = getNoteById(questionId);
    if (!q || q.type !== "QUESTION") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (q.user.wallet !== session.user.walletAddress) {
      return NextResponse.json(
        { error: "forbidden", message: "Only the question owner can archive" },
        { status: 403 }
      );
    }
    archiveQuestionFake(questionId);
    return NextResponse.json({ archived: true });
  }

  const wallet = session.user.walletAddress;

  const q = await getNoteByIdWithUser(questionId);
  if (!q || q.type !== "QUESTION") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (q.user_wallet !== wallet) {
    return NextResponse.json(
      { error: "forbidden", message: "Only the question owner can archive" },
      { status: 403 }
    );
  }

  await archiveQuestion(questionId);
  return NextResponse.json({ archived: true });
}
