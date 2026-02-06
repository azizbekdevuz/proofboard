'use client';

import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { verifyAndConsume } from '@/components/verify';
import { fetchWithTimeout, FETCH_TIMEOUT_WRITE_MS } from '@/lib/network';
import type { Category } from '@/libs/types';

/**
 * New Post form - Text input, category selection, Post
 */
export function NewPostForm() {
  const [text, setText] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const r = await fetchWithTimeout('/api/categories');
      if (r.ok) {
        const data = await r.json();
        setCategories(data || []);
        if (data?.length) setSelectedCategoryId((id) => id || data[0].id);
      }
    } catch {
      setCategoriesError('Could not load categories. Tap Retry.');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('Please write your thoughts');
      return;
    }
    if (!selectedCategoryId) {
      setError('Please select a category');
      return;
    }
    if (text.length > 300) {
      setError('Post must be 300 characters or less');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const action = process.env.NEXT_PUBLIC_ACTION_POST_QUESTION;
      if (!action) throw new Error('Action ID not configured');

      const proof = await verifyAndConsume(action, selectedCategoryId);

      const res = await fetchWithTimeout(
        '/api/questions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId: selectedCategoryId,
            text: text.trim(),
            proof,
          }),
        },
        FETCH_TIMEOUT_WRITE_MS
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to post');

      router.push(`/categories/${selectedCategoryId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const remaining = 300 - text.length;
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="flex flex-col gap-4">
      {/* One thought, one category */}
      {selectedCategory && (
        <p className="text-sm font-semibold text-gray-700">
          Asking in: <span className="inline-block px-3 py-1 rounded-full glass text-indigo-700 font-medium">{selectedCategory.name}</span>
          <span className="block text-xs font-normal text-gray-500 mt-0.5">One thought, one category.</span>
        </p>
      )}

      {/* Text input */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="write your thoughts here..."
        maxLength={300}
        rows={4}
        className="w-full p-4 rounded-2xl border border-white/50 bg-white/40 backdrop-blur-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400/50"
      />
      <p className={`text-xs ${remaining < 20 ? 'text-red-500' : 'text-gray-500'}`}>
        {remaining} characters left
      </p>

      {/* Categories (Figma: selected in blue) */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Pick one category</p>
        {categoriesLoading ? (
          <p className="text-sm text-gray-500">Loading categories...</p>
        ) : categoriesError ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-red-500">{categoriesError}</p>
            <Button variant="secondary" size="sm" onClick={loadCategories}>
              Retry
            </Button>
          </div>
        ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategoryId === cat.id
                  ? 'glass border-white/50 text-indigo-700 font-semibold'
                  : 'bg-white/50 border border-white/50 text-gray-700 hover:bg-white/60'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <LiveFeedback
        label={{ pending: 'Posting...', failed: 'Failed', success: 'Posted!' }}
        state={isSubmitting ? 'pending' : undefined}
      >
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          disabled={isSubmitting || !text.trim() || !selectedCategoryId}
        >
          Post
        </Button>
      </LiveFeedback>
    </div>
  );
}
