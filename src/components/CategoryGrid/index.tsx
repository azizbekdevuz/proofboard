"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { PostCard, type PostCardNote } from "@/components/PostCard";
import { fetchWithTimeout, getResponseError } from "@/lib/network";
import type { Category } from "@/lib/types";
import { RefreshDouble, MessageText } from "iconoir-react";

/**
 * Category view – dark grid of post cards.
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
            className="aspect-square rounded-[var(--card-radius)] skeleton"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-4">
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
    );
  }

  if (!category) {
    return (
      <div className="py-16 text-center">
        <p className="text-[var(--text-tertiary)]">Category not found</p>
        <button
          type="button"
          onClick={() => router.push("/categories")}
          className="mt-3 text-sm font-medium text-[var(--accent-violet)] hover:underline"
        >
          Back to Categories
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="py-16 text-center flex flex-col items-center gap-3">
        <div className="text-4xl">💭</div>
        <p className="text-[var(--text-secondary)] text-sm">
          Be the first to share a thought here.
        </p>
        <button
          type="button"
          onClick={() => router.push("/home/create")}
          className="text-sm font-medium text-[var(--accent-violet)] hover:underline flex items-center gap-1.5"
        >
          <MessageText className="w-4 h-4" />
          Ask a question
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 stagger-children">
        {questions.map((q) => (
          <PostCard
            key={q.id}
            question={{ ...q, categoryName: category.name }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => router.push("/home/create")}
        className="text-sm font-medium text-[var(--accent-violet)] hover:underline flex items-center gap-1.5"
      >
        <MessageText className="w-4 h-4" />
        Ask a question
      </button>
    </div>
  );
}
