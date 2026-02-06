import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

/**
 * GET /api/my/answers
 * Returns all answers posted by the authenticated user
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

  // Fetch user's answers with question and category info
  const answers = await db.answer.findMany({
    where: { userId: user.id },
    include: {
      question: {
        include: {
          category: { select: { id: true, name: true } },
        },
        select: {
          id: true,
          text: true,
          acceptedId: true,
          category: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(answers);
}
