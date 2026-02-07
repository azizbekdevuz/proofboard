"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { PostCard, type PostCardNote } from "@/components/PostCard";
import { fetchWithTimeout, getResponseError } from "@/lib/network";
import { getCategoryIndex, CATEGORY_PILL_CLASSES } from "@/lib/category-colors";
import type { CategoryWithCount } from "@/lib/types";
import { RefreshDouble } from "iconoir-react";

/**
 * Explore feed – dark pills + glowing grid.
 */
export const ExploreFeed = () => {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [questions, setQuestions] = useState<PostCardNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetchWithTimeout("/api/categories");
      if (res.ok) setCategories(await res.json());
    } catch (e) {
      console.error("Failed to fetch categories:", e);
    }
  }, []);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithTimeout("/api/questions");
      if (res.ok) {
        const data = await res.json();
        setQuestions(Array.isArray(data) ? data : []);
      } else {
        setQuestions([]);
        setError(await getResponseError(res, "Could not load. Tap Retry."));
      }
    } catch (e) {
      console.error("Failed to fetch questions:", e);
      setQuestions([]);
      setError(e instanceof Error ? e.message : "Could not load. Tap Retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const enrichedQuestions = questions.map((q) => ({
    ...q,
    categoryName: catMap.get(q.category) ?? undefined,
  }));

  return (
    <div className="flex flex-col gap-5">
      {/* Horizontal category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 scrollbar-hide">
        <span className="shrink-0 px-5 py-3 rounded-full text-sm font-semibold cat-pill-all">
          All
        </span>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => router.push(`/categories/${cat.id}`)}
            className={`shrink-0 px-5 py-3 rounded-full text-sm font-medium transition-[background,border-color,transform] duration-300 ${
              CATEGORY_PILL_CLASSES[getCategoryIndex(cat.id)]
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid */}
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
            onClick={fetchQuestions}
            className="btn-accent px-6 py-4 flex items-center gap-2 text-sm"
          >
            <RefreshDouble className="w-4 h-4" />
            Retry
          </button>
        </div>
      ) : enrichedQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="text-4xl mb-2">🤔</div>
          <p className="text-[var(--text-tertiary)] text-center text-sm">
            No posts yet
          </p>
          <button
            type="button"
            onClick={() => router.push("/home/create")}
            className="text-sm font-medium text-[var(--accent-violet)] hover:underline"
          >
            Create the first post
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 stagger-children">
          {enrichedQuestions.map((q) => (
            <PostCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
};
