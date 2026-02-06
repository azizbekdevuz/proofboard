'use client';

import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
    try {
      // Fetch user's questions and answers
      // Note: We'll need to add these API routes in Phase 3
      // For now, this is a placeholder structure
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch activity:', error);
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
              <Button
                key={question.id}
                variant="secondary"
                size="lg"
                className="w-full justify-start text-left"
                onClick={() => router.push(`/category/${question.categoryId}`)}
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-sm font-medium line-clamp-2">
                    {question.text}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{question.category.name}</span>
                    <span>•</span>
                    <span>{question._count.answers} answers</span>
                    {question.acceptedId && (
                      <>
                        <span>•</span>
                        <span className="text-green-600">Accepted</span>
                      </>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {myAnswers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">My Answers</h3>
          <div className="flex flex-col gap-2">
            {myAnswers.map((answer) => (
              <Button
                key={answer.id}
                variant="secondary"
                size="lg"
                className="w-full justify-start text-left"
                onClick={() =>
                  router.push(`/category/${answer.question.category.id}`)
                }
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-sm font-medium line-clamp-2">
                    {answer.text}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>To: {answer.question.text.substring(0, 30)}...</span>
                    {answer.question.acceptedId === answer.id && (
                      <>
                        <span>•</span>
                        <span className="text-green-600">Accepted</span>
                      </>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
