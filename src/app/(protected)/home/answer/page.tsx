"use client";

import { Page } from "@/components/PageLayout";
import { TopBar, Button } from "@worldcoin/mini-apps-ui-kit-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { PostCard, type PostCardNote } from "@/components/PostCard";
import { fetchWithTimeout } from "@/lib/network";
import type { CategoryWithCount } from "@/libs/types";
import { NavArrowLeft } from "iconoir-react";

/**
 * Answer flow – random questions from different categories. Shuffle client-side.
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
      if (catRes.ok) {
        const data = await catRes.json();
        setCategories(data || []);
      }
      if (qRes.ok) {
        const data = await qRes.json();
        const shuffled = [...(data || [])].sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
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
      <Page.Header className="p-0">
        <TopBar
          title="Answer"
          startAdornment={
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="touch-target flex items-center justify-center p-2 -ml-1 rounded-full hover:bg-gray-100 active:bg-gray-200"
              aria-label="Back"
            >
              <NavArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
          }
        />
      </Page.Header>
      <Page.Main className="flex flex-col bg-linear-to-b from-yellow-50/50 via-white to-blue-50/40 min-h-0">
        <div className="mb-3">
          <button
            type="button"
            onClick={() => router.push("/categories")}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Browse by category
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-xl bg-indigo-100/50 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <p className="text-gray-600 text-center text-sm">{error}</p>
            <Button variant="primary" size="lg" onClick={load}>
              Retry
            </Button>
          </div>
        ) : enrichedQuestions.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p>No questions to answer yet.</p>
            <button
              type="button"
              onClick={() => router.push("/categories")}
              className="mt-2 text-sm font-medium text-indigo-600 hover:underline"
            >
              Browse categories
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {enrichedQuestions.map((q) => (
              <PostCard key={q.id} question={q} />
            ))}
          </div>
        )}
      </Page.Main>
    </>
  );
}
