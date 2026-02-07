"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { ComposeQuestion } from "@/components/ComposeQuestion";
import { QuestionCard } from "@/components/QuestionCard";
import { fetchWithTimeout } from "@/lib/network";
import type { Category, QuestionNote } from "@/lib/types";
import { RefreshDouble, MessageText } from "iconoir-react";

/**
 * CategoryBoard – dark glass board with question cards.
 */
export const CategoryBoard = ({ categoryId }: { categoryId: string }) => {
  const [category, setCategory] = useState<Category | null>(null);
  const [questions, setQuestions] = useState<QuestionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const router = useRouter();

  const fetchCategoryAndQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoriesRes, questionsRes] = await Promise.all([
        fetchWithTimeout("/api/categories"),
        fetchWithTimeout(`/api/questions?categoryId=${categoryId}`),
      ]);
      if (categoriesRes.ok) {
        const categories = await categoriesRes.json();
        const cat = categories.find((c: Category) => c.id === categoryId);
        setCategory(cat || null);
      }
      if (questionsRes.ok) {
        const data = await questionsRes.json();
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(
        err instanceof Error ? err.message : "Could not load. Tap Retry."
      );
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchCategoryAndQuestions();
  }, [fetchCategoryAndQuestions]);

  const handleQuestionPosted = () => {
    setShowCompose(false);
    fetchCategoryAndQuestions();
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-40 rounded-[var(--card-radius)]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-[var(--text-secondary)] text-center text-sm">
          {error}
        </p>
        <button
          type="button"
          onClick={fetchCategoryAndQuestions}
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
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-[var(--text-tertiary)]">Category not found</p>
        <button
          type="button"
          onClick={() => router.push("/categories")}
          className="text-sm font-medium text-[var(--accent-violet)] hover:underline"
        >
          Back to categories
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      <div className="mb-1">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-0.5">
          {category.name}
        </h2>
        <p className="text-sm text-[var(--text-tertiary)]">
          {questions.length} question{questions.length !== 1 ? "s" : ""}
        </p>
      </div>

      {!showCompose && (
        <button
          type="button"
          onClick={() => setShowCompose(true)}
          className="btn-accent w-full py-4 flex items-center justify-center gap-2 text-sm"
        >
          <MessageText className="w-4 h-4" />
          Post a Question
        </button>
      )}

      {showCompose && (
        <ComposeQuestion
          categoryId={categoryId}
          onSuccess={handleQuestionPosted}
          onCancel={() => setShowCompose(false)}
        />
      )}

      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="text-4xl">💭</div>
          <p className="text-[var(--text-tertiary)] text-center text-sm">
            No questions yet. Be the first to post!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 stagger-children">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onAnswerPosted={fetchCategoryAndQuestions}
            />
          ))}
        </div>
      )}
    </div>
  );
};
