import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCategories, isFakeDataEnabled } from "@/lib/fake-data";
import { CATEGORIES } from "@/lib/categories";

export async function GET() {
  if (isFakeDataEnabled()) {
    return NextResponse.json(getCategories());
  }

  // Categories are a fixed list. Count questions per category from the DB.
  const counts = await db.note.groupBy({
    by: ["category"],
    where: { type: "QUESTION" },
    _count: { _all: true },
  });

  const countMap = new Map(counts.map((c) => [c.category, c._count._all]));

  const result = CATEGORIES.map((cat) => ({
    ...cat,
    _count: { questions: countMap.get(cat.id) ?? 0 },
  }));

  return NextResponse.json(result);
}
