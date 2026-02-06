"use client";

import { Button, LiveFeedback } from "@worldcoin/mini-apps-ui-kit-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { ComposeQuestion } from "@/components/ComposeQuestion";
import { QuestionCard } from "@/components/QuestionCard";
import { fetchWithTimeout } from "@/lib/network";
import type { Category, QuestionNote } from "@/libs/types";

/**
 * CategoryBoard component - Displays questions as sticky notes
 * Shows compose question form and list of questions with answers
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
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500">Loading board...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <p className="text-gray-600 text-center text-sm">{error}</p>
        <Button variant="primary" onClick={fetchCategoryAndQuestions}>
          Retry
        </Button>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-gray-500 text-center">Category not found</p>
        <Button
          variant="secondary"
          onClick={() => router.push("/categories")}
        >
          Back to categories
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <h2 className="text-xl font-bold mb-1">{category.name}</h2>
        <p className="text-sm text-gray-600">
          {questions.length} question{questions.length !== 1 ? "s" : ""}
        </p>
      </div>

      {!showCompose && (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => setShowCompose(true)}
        >
          Post a Question
        </Button>
      )}

      {showCompose && (
        <ComposeQuestion
          categoryId={categoryId}
          onSuccess={handleQuestionPosted}
          onCancel={() => setShowCompose(false)}
        />
      )}

      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-gray-500 text-center">
            No questions yet. Be the first to post!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
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
