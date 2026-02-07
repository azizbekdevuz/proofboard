'use client';

import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ComposeQuestion } from '@/components/ComposeQuestion';
import { QuestionCard } from '@/components/QuestionCard';

interface Question {
  id: string;
  text: string;
  createdAt: string;
  acceptedId: string | null;
  user: {
    username: string | null;
    wallet: string;
  };
  answers: Array<{
    id: string;
    text: string;
    createdAt: string;
    user: {
      username: string | null;
    };
  }>;
  _count: {
    answers: number;
  };
}

interface Category {
  id: string;
  name: string;
}

/**
 * CategoryBoard component - Displays questions as sticky notes
 * Shows compose question form and list of questions with answers
 */
export const CategoryBoard = ({ categoryId }: { categoryId: string }) => {
  const [category, setCategory] = useState<Category | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    fetchCategoryAndQuestions();
  }, [categoryId]);

  const fetchCategoryAndQuestions = async () => {
    try {
      // Fetch category info
      const categoriesRes = await fetch('/api/categories');
      if (categoriesRes.ok) {
        const categories = await categoriesRes.json();
        const cat = categories.find((c: Category) => c.id === categoryId);
        setCategory(cat || null);
      }

      // Fetch questions
      const questionsRes = await fetch(`/api/questions?categoryId=${categoryId}`);
      if (questionsRes.ok) {
        const data = await questionsRes.json();
        // Randomize order for variety
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionPosted = () => {
    setShowCompose(false);
    fetchCategoryAndQuestions();
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-white rounded-3xl border border-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-gray-900 font-medium mb-1">Category not found</p>
          <p className="text-sm text-gray-500 mb-4">This category doesn't exist</p>
          <Button variant="secondary" onClick={() => router.push('/home/thoughts')}>
            Back to Categories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="mb-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-8 bg-indigo-600 rounded-full" />
          <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
        </div>
        <p className="text-sm text-gray-500 pl-4">
          {questions.length} question{questions.length !== 1 ? 's' : ''} • Human-verified only
        </p>
      </div>

      {!showCompose && (
        session ? (
          <button
            onClick={() => setShowCompose(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold py-4 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post a Question
          </button>
        ) : (
          <div className="w-full p-4 bg-gray-50 border border-gray-300 rounded-2xl text-center">
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-semibold">Posting requires World App</span>
            </p>
            <p className="text-xs text-gray-600">
              Open this app in World App to post questions and verify your humanity
            </p>
          </div>
        )
      )}

      {showCompose && (
        <ComposeQuestion
          categoryId={categoryId}
          onSuccess={handleQuestionPosted}
          onCancel={() => setShowCompose(false)}
        />
      )}

      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white rounded-3xl border border-gray-200">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-center max-w-xs">
            <p className="text-gray-900 font-semibold mb-1">
              No questions yet
            </p>
            <p className="text-sm text-gray-600 mb-2">
              Be the first to ask! Your question will be verified with World ID to ensure it's from a real human.
            </p>
            <p className="text-xs text-gray-500">
              Tap "Post a Question" above to get started
            </p>
          </div>
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
