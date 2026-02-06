import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getNoteById,
  getAnswersForQuestion,
  isFakeDataEnabled,
} from "@/lib/fake-data";
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

  const note = await db.note.findUnique({
    where: { id },
    include: {
      user: { select: { username: true, wallet: true } },
    },
  });

  if (!note || note.type !== "QUESTION") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch answer notes for this question
  const answers = await db.note.findMany({
    where: { type: "ANSWER", referenceId: id },
    include: {
      user: { select: { username: true, wallet: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    ...note,
    categoryName: getCategoryName(note.category),
    answers,
  });
}
