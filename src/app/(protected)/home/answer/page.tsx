"use client";

import { Page } from "@/components/PageLayout";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { PostCard, type PostCardNote } from "@/components/PostCard";
import { fetchWithTimeout } from "@/lib/network";
import type { CategoryWithCount } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { RefreshDouble, GridPlus } from "iconoir-react";

/**
 * Answer flow – random questions, dark premium grid.
 */
export default function AnswerPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [questions, setQuestions] = useState<PostCardNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, qRes] = await Promise.all([
        fetchWithTimeout("/api/categories"),
        fetchWithTimeout("/api/questions"),
      ]);
      if (catRes.ok) setCategories((await catRes.json()) || []);
      if (qRes.ok) {
        const data = await qRes.json();
        setQuestions([...(data || [])].sort(() => Math.random() - 0.5));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load. Tap Retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const enrichedQuestions = questions.map((q) => ({
    ...q,
    categoryName: catMap.get(q.category) ?? undefined,
  }));

  return (
    <>
      <AppHeader backHref="/home" title="Answer" />

      <Page.Main className="flex flex-col gap-4 min-h-0">
        <button
          type="button"
          onClick={() => router.push("/categories")}
          className="text-sm font-medium text-[var(--accent-violet)] hover:underline flex items-center gap-1.5 w-fit"
        >
          <GridPlus className="w-4 h-4" />
          Browse by category
        </button>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-[var(--card-radius)] skeleton"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <p className="text-[var(--text-secondary)] text-center text-sm">
              {error}
            </p>
            <button
              type="button"
              onClick={load}
              className="btn-accent px-6 py-4 flex items-center gap-2 text-sm"
            >
              <RefreshDouble className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : enrichedQuestions.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <div className="text-4xl">🤷</div>
            <p className="text-[var(--text-tertiary)]">
              No questions to answer yet.
            </p>
            <button
              type="button"
              onClick={() => router.push("/categories")}
              className="text-sm font-medium text-[var(--accent-violet)] hover:underline"
            >
              Browse categories
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 stagger-children">
            {enrichedQuestions.map((q) => (
              <PostCard key={q.id} question={q} />
            ))}
          </div>
        )}
      </Page.Main>
    </>
  );
}
