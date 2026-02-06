"use client";

import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { fetchWithTimeout } from "@/lib/network";
import type { CategoryWithCount } from "@/libs/types";

/**
 * CategoriesList component - Displays all available categories
 * Users can tap a category to view its questions board
 */
export const CategoriesList = () => {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithTimeout("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setError(
        err instanceof Error ? err.message : "Could not load. Tap Retry."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500">Loading categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <p className="text-gray-600 text-center text-sm">{error}</p>
        <Button variant="primary" onClick={fetchCategories}>
          Retry
        </Button>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-gray-500 text-center">
          No categories yet. Categories will appear here once created.
        </p>
        <p className="text-sm text-gray-400 text-center">
          Check back soon or create a category to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="mb-2">
        <h2 className="text-lg font-semibold mb-1">Browse Categories</h2>
        <p className="text-sm text-gray-600">
          Tap a category to view questions and answers
        </p>
      </div>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant="secondary"
          size="lg"
          className="w-full justify-between"
          onClick={() => router.push(`/category/${category.id}`)}
        >
          <div className="flex flex-col items-start">
            <span className="font-semibold">{category.name}</span>
            <span className="text-xs text-gray-500">
              {category._count.questions} question
              {category._count.questions !== 1 ? "s" : ""}
            </span>
          </div>
        </Button>
      ))}
    </div>
  );
};
