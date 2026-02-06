import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { wallet, username, questionId, text } = await req.json();

  if (!wallet || !questionId || !text) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (text.length > 300) return NextResponse.json({ error: "too_long" }, { status: 400 });

  const user = await db.user.upsert({
    where: { wallet },
    update: { username },
    create: { wallet, username },
  });

  const a = await db.answer.create({
    data: { userId: user.id, questionId, text },
  });

  return NextResponse.json(a);
}
