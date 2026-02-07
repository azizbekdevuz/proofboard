"use client";

import { LiveFeedback } from "@worldcoin/mini-apps-ui-kit-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { verifyAndConsume } from "@/components/verify";
import { fetchWithTimeout, FETCH_TIMEOUT_WRITE_MS } from "@/lib/network";
import type { Category } from "@/lib/types";
import { RefreshDouble } from "iconoir-react";

/**
 * New Post form – dark premium design.
 */
export function NewPostForm() {
  const [text, setText] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const r = await fetchWithTimeout("/api/categories");
      if (r.ok) {
        const data = await r.json();
        setCategories(data || []);
        if (data?.length) setSelectedCategoryId((id) => id || data[0].id);
      }
    } catch {
      setCategoriesError("Could not load categories. Tap Retry.");
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError("Please write your thoughts");
      return;
    }
    if (!selectedCategoryId) {
      setError("Please select a category");
      return;
    }
    if (text.length > 300) {
      setError("Post must be 300 characters or less");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const action = process.env.NEXT_PUBLIC_ACTION_POST_QUESTION;
      if (!action)
        throw new Error(
          "Action ID not configured. Add NEXT_PUBLIC_ACTION_POST_QUESTION to .env.local (see .env.sample)."
        );
      const proof = await verifyAndConsume(action, selectedCategoryId);
      const res = await fetchWithTimeout(
        "/api/questions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: selectedCategoryId,
            text: text.trim(),
            proof,
          }),
        },
        FETCH_TIMEOUT_WRITE_MS
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || data.error || "Failed to post");
      router.push(`/categories/${selectedCategoryId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to post. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const remaining = 300 - text.length;
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* Category badge */}
      {selectedCategory && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-secondary)]">
            Asking in
          </span>
          <span className="inline-block px-3 py-1 rounded-full bg-[var(--accent-violet-dim)] border border-[rgba(167,139,250,0.2)] text-[var(--accent-violet-bright)] text-sm font-medium">
            {selectedCategory.name}
          </span>
        </div>
      )}

      {/* Text input */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your thoughts here..."
        maxLength={300}
        rows={5}
        className="input-dark w-full p-4 resize-none text-sm"
      />
      <p
        className={`text-xs ${
          remaining < 20
            ? "text-[var(--accent-rose)]"
            : "text-[var(--text-tertiary)]"
        }`}
      >
        {remaining} characters left
      </p>

      {/* Categories */}
      <div>
        <p className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
          Pick a category
        </p>
        {categoriesLoading ? (
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton w-20 h-9 rounded-full" />
            ))}
          </div>
        ) : categoriesError ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-[var(--accent-rose)]">
              {categoriesError}
            </p>
            <button
              type="button"
              onClick={loadCategories}
              className="btn-ghost px-5 py-3 text-sm flex items-center gap-2 w-fit"
            >
              <RefreshDouble className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-5 py-3 rounded-full text-sm font-medium transition-[background,border-color,color] duration-300 ${
                  selectedCategoryId === cat.id
                    ? "bg-[var(--accent-violet-dim)] border border-[var(--accent-violet)] text-[var(--accent-violet-bright)] shadow-[0_0_12px_var(--accent-violet-dim)]"
                    : "bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-medium)]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-[var(--accent-rose)]">{error}</p>}

      <LiveFeedback
        label={{ pending: "Posting...", failed: "Failed", success: "Posted!" }}
        state={isSubmitting ? "pending" : undefined}
      >
        <button
          type="button"
          className="btn-accent w-full py-5 text-[15px] disabled:opacity-40"
          onClick={handleSubmit}
          disabled={isSubmitting || !text.trim() || !selectedCategoryId}
        >
          Post
        </button>
      </LiveFeedback>
    </div>
  );
}
