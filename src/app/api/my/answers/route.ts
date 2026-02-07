import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { getMyAnswers, isFakeDataEnabled } from "@/lib/fake-data";
import { getMyAnswersWithQuestions, toNoteApiResponse } from "@/lib/notes-sql";

/**
 * GET /api/my/answers
 * Returns all ANSWER notes posted by the authenticated user (real SQL).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- NextRequest required by route signature
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

  const rows = await getMyAnswersWithQuestions(user.id);
  const result = rows.map((a) => {
    const { question_id, question_text, question_category, ...notePart } = a;
    return {
      ...toNoteApiResponse(notePart),
      question: {
        id: question_id ?? a.referenceId,
        text: question_text ?? "",
        category: question_category ?? a.category,
      },
    };
  });

  return NextResponse.json(result);
}
