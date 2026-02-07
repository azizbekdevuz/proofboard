import { NextRequest, NextResponse } from "next/server";
import {
  getNoteById,
  getAnswersForQuestion,
  isFakeDataEnabled,
} from "@/lib/fake-data";
import {
  getQuestionById,
  getAnswersForQuestion as getAnswersForQuestionSql,
  incrementView,
  toNoteApiResponse,
} from "@/lib/notes-sql";
import { getCategoryName } from "@/lib/categories";

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

  await incrementView(id);

  const answers = await getAnswersForQuestionSql(id);

  return NextResponse.json({
    ...toNoteApiResponse(note),
    categoryName: getCategoryName(note.category),
    answers: answers.map(toNoteApiResponse),
  });
}
