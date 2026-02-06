import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

/**
 * GET /api/my/questions
 * Returns all questions posted by the authenticated user
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.walletAddress) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const wallet = session.user.walletAddress;

  // Find user by wallet
  const user = await db.user.findUnique({
    where: { wallet },
  });

  if (!user) {
    return NextResponse.json([]);
  }

  // Fetch user's questions
  const questions = await db.question.findMany({
    where: { userId: user.id },
    include: {
      category: { select: { id: true, name: true } },
      _count: { select: { answers: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(questions);
}
