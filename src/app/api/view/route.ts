import { NextRequest, NextResponse } from "next/server";
import { recordUniqueView } from "@/lib/notes-sql";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * POST /api/view?questionId=...
 * Record a unique view (counted once per user per question). Requires auth.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.walletAddress) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get("questionId");

  if (!questionId) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { wallet: session.user.walletAddress },
  });
  const result = await recordUniqueView(questionId, user?.id ?? null);
  if (!result) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ viewed: true, viewsCount: result.viewsCount });
}
