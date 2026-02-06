import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get("questionId");

  if (!questionId) {
    return NextResponse.json({ error: "questionId required" }, { status: 400 });
  }

  const answers = await db.answer.findMany({
    where: { questionId },
    include: {
      user: { select: { username: true, wallet: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(answers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.walletAddress) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { questionId, text } = await req.json();

  if (!questionId || !text) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (text.length > 300) {
    return NextResponse.json({ error: "too_long" }, { status: 400 });
  }

  const wallet = session.user.walletAddress;
  const username = session.user.username || null;

  const user = await db.user.upsert({
    where: { wallet },
    update: { username },
    create: { wallet, username },
  });

  const a = await db.answer.create({
    data: { userId: user.id, questionId, text },
    include: {
      user: { select: { username: true, wallet: true } },
    },
  });

  return NextResponse.json(a);
}
