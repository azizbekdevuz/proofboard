"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { PostCard, type PostCardNote } from "@/components/PostCard";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { fetchWithTimeout, getResponseError } from "@/lib/network";
import type { Category } from "@/libs/types";

/**
 * Category view - Grid of post cards (Figma Category Name screen)
 * Timeout + error/retry to avoid infinite loading (World App Technical Requirements).
 */
export function CategoryGrid({ categoryId }: { categoryId: string }) {
  const [category, setCategory] = useState<Category | null>(null);
  const [questions, setQuestions] = useState<PostCardNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, qRes] = await Promise.all([
        fetchWithTimeout("/api/categories"),
        fetchWithTimeout(`/api/questions?categoryId=${categoryId}`),
      ]);
      if (catRes.ok) {
        const cats = await catRes.json();
        const list = Array.isArray(cats) ? cats : [];
        const c = list.find((x: Category) => x.id === categoryId);
        setCategory(c || null);
      } else {
        setCategory(null);
      }
      if (qRes.ok) {
        const data = await qRes.json();
        setQuestions(Array.isArray(data) ? data : []);
      } else {
        setQuestions([]);
        setError(await getResponseError(qRes, "Could not load. Tap Retry."));
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Could not load. Tap Retry.");
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="aspect-square rounded-2xl cat-grid-skeleton animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3">
        <p className="text-gray-600 text-center text-sm">{error}</p>
        <Button variant="primary" size="lg" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="py-12 text-center text-gray-500">
        Category not found
        <button
          type="button"
          onClick={() => router.push("/categories")}
          className="block mt-2 text-indigo-600 hover:underline font-medium"
        >
          Back to Categories
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-600 mb-1">Be the first to share a thought in this category.</p>
        <button
          type="button"
          onClick={() => router.push("/home/create")}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          Ask a question
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {questions.map((q) => (
          <PostCard key={q.id} question={{ ...q, categoryName: category.name }} />
        ))}
      </div>
      <p className="pt-2">
        <button
          type="button"
          onClick={() => router.push("/home/create")}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Ask a question
        </button>
      </p>
    </div>
  );
}
