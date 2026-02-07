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

  // Fetch user's answers (notes of type ANSWER)
  const answers = await db.note.findMany({
    where: { 
      userId: user.id,
      type: 'ANSWER',
      deletedAt: null, // Exclude soft-deleted notes
    },
    include: {
      parent: {
        select: {
          id: true,
          text: true,
          acceptedAnswerId: true,
          category: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Transform to match old API shape for backward compatibility
  const transformed = answers.map(answer => ({
    id: answer.id,
    questionId: answer.parentId,
    userId: answer.userId,
    text: answer.text,
    createdAt: answer.createdAt,
    question: answer.parent ? {
      id: answer.parent.id,
      text: answer.parent.text,
      acceptedId: answer.parent.acceptedAnswerId,
      category: answer.parent.category,
    } : null,
  }));

  return NextResponse.json(transformed);
}
