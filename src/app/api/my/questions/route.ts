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

  // Fetch user's questions (notes of type QUESTION)
  const questions = await db.note.findMany({
    where: { 
      userId: user.id,
      type: 'QUESTION',
      deletedAt: null, // Exclude soft-deleted notes
    },
    include: {
      category: { select: { id: true, name: true } },
      _count: { select: { children: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Transform to match old API shape for backward compatibility
  const transformed = questions.map(q => ({
    id: q.id,
    categoryId: q.categoryId,
    userId: q.userId,
    text: q.text,
    createdAt: q.createdAt,
    acceptedId: q.acceptedAnswerId,
    category: q.category,
    _count: { answers: q._count.children },
  }));

  return NextResponse.json(transformed);
}
