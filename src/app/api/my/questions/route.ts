import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { getMyQuestions, isFakeDataEnabled } from "@/lib/fake-data";

/**
 * GET /api/my/questions
 * Returns all QUESTION notes posted by the authenticated user.
 * Completed (accepted) and archived questions are pushed to the bottom.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.walletAddress) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const wallet = session.user.walletAddress;

  if (isFakeDataEnabled()) {
    return NextResponse.json(getMyQuestions(wallet));
  }

  const user = await db.user.findUnique({
    where: { wallet },
  });

  if (!user) {
    return NextResponse.json([]);
  }

  const notes = await db.note.findMany({
    where: { userId: user.id, type: "QUESTION" },
    include: {
      user: { select: { username: true, wallet: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Sort: active questions first, completed/archived last
  const sorted = [...notes].sort((a, b) => {
    const aCompleted = a.acceptedAnswerId !== "" || a.isArchived ? 1 : 0;
    const bCompleted = b.acceptedAnswerId !== "" || b.isArchived ? 1 : 0;
    if (aCompleted !== bCompleted) return aCompleted - bCompleted;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return NextResponse.json(sorted);
}
