import { NextRequest, NextResponse } from "next/server";
import {
  getNoteById,
  getAnswersForQuestion,
  isFakeDataEnabled,
} from "@/lib/fake-data";
import {
  getQuestionById,
  getAnswersForQuestion as getAnswersForQuestionSql,
  recordUniqueView,
  toNoteApiResponse,
} from "@/lib/notes-sql";
import { getCategoryName } from "@/lib/categories";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (isFakeDataEnabled()) {
    const note = getNoteById(id);
    if (!note || note.type !== "QUESTION") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const answers = getAnswersForQuestion(id);
    return NextResponse.json({
      ...note,
      categoryName: getCategoryName(note.category),
      answers,
    });
  }

  const note = await getQuestionById(id);
  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await auth();
  const user = session?.user?.walletAddress
    ? await db.user.findUnique({
        where: { wallet: session.user.walletAddress },
      })
    : null;
  await recordUniqueView(id, user?.id ?? null);

  const answers = await getAnswersForQuestionSql(id);

  return NextResponse.json({
    ...toNoteApiResponse(note),
    categoryName: getCategoryName(note.category),
    answers: answers.map(toNoteApiResponse),
  });
}
