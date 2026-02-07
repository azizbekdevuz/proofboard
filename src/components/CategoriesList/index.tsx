'use client';

import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Category {
  id: string;
  name: string;
  _count: {
    questions: number;
  };
}

/**
 * CategoriesList component - Displays all available categories
 * Users can tap a category to view its questions board
 */
export const CategoriesList = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white rounded-2xl border border-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-gray-900 font-medium mb-1">
            No categories yet
          </p>
          <p className="text-sm text-gray-500">
            Categories will appear here once created
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="mb-1">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Browse Topics</h2>
        <p className="text-sm text-gray-500">
          Tap a category to explore questions
        </p>
      </div>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => router.push(`/category/${category.id}`)}
          className="w-full bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between hover:border-indigo-300 hover:shadow-md active:scale-[0.98] transition-all group"
        >
          <div className="flex flex-col items-start">
            <span className="font-semibold text-gray-900 text-base mb-1">{category.name}</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {category._count.questions} question{category._count.questions !== 1 ? 's' : ''}
            </span>
          </div>
          <svg 
            className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ))}
    </div>
  );
};
