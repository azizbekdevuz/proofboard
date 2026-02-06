import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");

  if (!categoryId) {
    return NextResponse.json({ error: "categoryId required" }, { status: 400 });
  }

  const questions = await db.question.findMany({
    where: { categoryId },
    include: {
      user: { select: { username: true, wallet: true } },
      answers: {
        include: { user: { select: { username: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { answers: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(questions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.walletAddress) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { categoryId, text } = await req.json();

  if (!categoryId || !text) {
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

  const q = await db.question.create({
    data: { userId: user.id, categoryId, text },
    include: {
      user: { select: { username: true, wallet: true } },
    },
  });

  return NextResponse.json(q);
}
