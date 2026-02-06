import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { wallet, questionId, answerId } = await req.json();
  if (!wallet || !questionId || !answerId) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const q = await db.question.findUnique({ where: { id: questionId }, include: { user: true } });
  if (!q) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (q.user.wallet !== wallet) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const updated = await db.question.update({
    where: { id: questionId },
    data: { acceptedId: answerId },
  });

  return NextResponse.json(updated);
}
