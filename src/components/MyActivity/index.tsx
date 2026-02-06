'use client';

import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface Question {
  id: string;
  text: string;
  categoryId: string;
  acceptedId: string | null;
  createdAt: string;
  category: {
    id: string;
    name: string;
  };
  _count: {
    answers: number;
  };
}

interface Answer {
  id: string;
  text: string;
  questionId: string;
  createdAt: string;
  question: {
    id: string;
    text: string;
    acceptedId: string | null;
    category: {
      id: string;
      name: string;
    };
  };
}

/**
 * MyActivity component - Shows user's questions and answers
 */
export const MyActivity = ({ wallet }: { wallet: string }) => {
  const [myQuestions, setMyQuestions] = useState<Question[]>([]);
  const [myAnswers, setMyAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (wallet) {
      fetchMyActivity();
    }
  }, [wallet]);

  const fetchMyActivity = async () => {
    if (!wallet) {
      setLoading(false);
      return;
    }

    try {
      // Fetch user's questions and answers in parallel
      const [questionsRes, answersRes] = await Promise.all([
        fetch('/api/my/questions'),
        fetch('/api/my/answers'),
      ]);

      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        setMyQuestions(questionsData);
      }

      if (answersRes.ok) {
        const answersData = await answersRes.json();
        setMyAnswers(answersData);
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500">Loading your activity...</p>
      </div>
    );
  }

  const hasActivity = myQuestions.length > 0 || myAnswers.length > 0;

  if (!hasActivity) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-gray-500 text-center">
          You haven't posted any questions or answers yet.
        </p>
        <Button
          variant="primary"
          onClick={() => router.push('/home/thoughts')}
        >
          Browse Categories
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {myQuestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">My Questions</h3>
          <div className="flex flex-col gap-2">
            {myQuestions.map((question) => (
              <div
                key={question.id}
                className="border-2 border-gray-200 rounded-xl p-3 bg-yellow-50 cursor-pointer hover:bg-yellow-100 transition-colors"
                onClick={() => router.push(`/category/${question.categoryId}`)}
              >
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {question.text}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="font-semibold">{question.category.name}</span>
                    <span>•</span>
                    <span>{question._count.answers} answer{question._count.answers !== 1 ? 's' : ''}</span>
                    {question.acceptedId && (
                      <>
                        <span>•</span>
                        <span className="text-green-600 font-semibold">✓ Accepted</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {myAnswers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">My Answers</h3>
          <div className="flex flex-col gap-2">
            {myAnswers.map((answer) => (
              <div
                key={answer.id}
                className={`border-2 rounded-xl p-3 cursor-pointer transition-colors ${
                  answer.question.acceptedId === answer.id
                    ? 'bg-green-50 border-green-300 hover:bg-green-100'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() =>
                  router.push(`/category/${answer.question.category.id}`)
                }
              >
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {answer.text}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>To: {answer.question.text.substring(0, 40)}...</span>
                    {answer.question.acceptedId === answer.id && (
                      <>
                        <span>•</span>
                        <span className="text-green-600 font-semibold">✓ Accepted</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {answer.question.category.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
