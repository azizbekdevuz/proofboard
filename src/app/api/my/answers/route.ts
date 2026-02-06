import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { getMyAnswers, isFakeDataEnabled } from "@/lib/fake-data";

/**
 * GET /api/my/answers
 * Returns all ANSWER notes posted by the authenticated user
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.walletAddress) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const wallet = session.user.walletAddress;

  if (isFakeDataEnabled()) {
    return NextResponse.json(getMyAnswers(wallet));
  }

  const user = await db.user.findUnique({
    where: { wallet },
  });

  if (!user) {
    return NextResponse.json([]);
  }

  const answerNotes = await db.note.findMany({
    where: { userId: user.id, type: "ANSWER" },
    include: {
      user: { select: { username: true, wallet: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Enrich each answer with the question it references
  const questionIds = [
    ...new Set(answerNotes.map((a) => a.referenceId).filter(Boolean)),
  ];
  const questions = questionIds.length
    ? await db.note.findMany({
        where: { id: { in: questionIds } },
        select: { id: true, text: true, category: true },
      })
    : [];
  const qMap = new Map(questions.map((q) => [q.id, q]));

  const result = answerNotes.map((a) => {
    const q = qMap.get(a.referenceId);
    return {
      ...a,
      question: {
        id: q?.id ?? a.referenceId,
        text: q?.text ?? "",
        category: q?.category ?? a.category,
      },
    };
  });

  return NextResponse.json(result);
}
