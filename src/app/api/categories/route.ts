import { NextResponse } from "next/server";
import { isFakeDataEnabled } from "@/lib/fake-data";
import { CATEGORIES } from "@/lib/categories";
import { getQuestionCountByCategory } from "@/lib/notes-sql";

/** Categories are static and hardcoded on the backend. Counts from DB when available. */
export async function GET() {
  if (isFakeDataEnabled()) {
    return NextResponse.json(
      CATEGORIES.map((cat) => ({ ...cat, _count: { questions: 0 } }))
    );
  }

  const countMap = await getQuestionCountByCategory();
  const result = CATEGORIES.map((cat) => ({
    ...cat,
    _count: { questions: countMap.get(cat.id) ?? 0 },
  }));

  return NextResponse.json(result);
}
