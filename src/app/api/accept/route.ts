import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.walletAddress) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { questionId, answerId } = await req.json();
  if (!questionId || !answerId) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const wallet = session.user.walletAddress;

  const q = await db.question.findUnique({
    where: { id: questionId },
    include: { user: true },
  });
  if (!q) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (q.user.wallet !== wallet) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const updated = await db.question.update({
    where: { id: questionId },
    data: { acceptedId: answerId },
    include: {
      user: { select: { username: true, wallet: true } },
      answers: {
        include: { user: { select: { username: true } } },
      },
    },
  });

  return NextResponse.json(updated);
}
