import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { likeQuestionFake, getNoteById, isFakeDataEnabled } from "@/lib/fake-data";

/**
 * POST /api/like
 * Like a question. Liked questions appear higher in the past-question archive.
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
    likeQuestionFake(questionId);
    return NextResponse.json({ liked: true, likesCount: q.likesCount });
  }

  const q = await db.note.findUnique({ where: { id: questionId } });
  if (!q || q.type !== "QUESTION") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updated = await db.note.update({
    where: { id: questionId },
    data: { likesCount: { increment: 1 } },
  });

  return NextResponse.json({ liked: true, likesCount: updated.likesCount });
}
