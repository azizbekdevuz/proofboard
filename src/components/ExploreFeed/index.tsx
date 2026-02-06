"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { PostCard, type PostCardNote } from "@/components/PostCard";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { fetchWithTimeout, getResponseError } from "@/lib/network";
import { getCategoryIndex, CATEGORY_PILL_CLASSES } from "@/lib/category-colors";
import type { CategoryWithCount } from "@/libs/types";

/**
 * Explore feed: horizontal category pills + grid of post previews (Figma Explore screen)
 * Uses timeouts and error+retry to avoid infinite loading (World App Technical Requirements).
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

  // Resolve category names for display
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const enrichedQuestions = questions.map((q) => ({
    ...q,
    categoryName: catMap.get(q.category) ?? undefined,
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Horizontal category pills - All stays here, categories navigate to Category View */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 scrollbar-hide">
        <span className="shrink-0 px-4 py-2 rounded-full text-sm font-medium cat-pill-all">
          All
        </span>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => router.push(`/categories/${cat.id}`)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
              CATEGORY_PILL_CLASSES[getCategoryIndex(cat.id)]
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid of post previews */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-xl cat-feed-skeleton animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <p className="text-gray-600 text-center text-sm">{error}</p>
          <Button variant="primary" size="lg" onClick={fetchQuestions}>
            Retry
          </Button>
        </div>
      ) : enrichedQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <p className="text-gray-500 text-center">No posts yet</p>
          <button
            type="button"
            onClick={() => router.push("/home/create")}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            Create the first post
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {enrichedQuestions.map((q) => (
            <PostCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
};
