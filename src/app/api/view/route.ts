import { NextRequest, NextResponse } from "next/server";
import { incrementView } from "@/lib/notes-sql";

/**
 * POST /api/view?questionId=...
 * Increment viewsCount for a question (real SQL).
 */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get("questionId");

  if (!questionId) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const result = await incrementView(questionId);
  if (!result) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ viewed: true, viewsCount: result.viewsCount });
}
