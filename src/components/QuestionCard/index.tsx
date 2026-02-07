'use client';

import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useState, useRef, useEffect } from 'react';
import { ComposeAnswer } from '@/components/ComposeAnswer';
import { LikeButton } from '@/components/LikeButton';
import { useSession } from 'next-auth/react';
import { getWorldIDProof } from '@/components/verify';
import { getActionViewNote } from '@/lib/worldActions';

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

interface QuestionCardProps {
  question: Question;
  onAnswerPosted: () => void;
}

/**
 * QuestionCard component - Displays a question with its answers
 * Shows compose answer form and accept answer button (for owner)
 */
export const QuestionCard = ({ question, onAnswerPosted }: QuestionCardProps) => {
  const [showCompose, setShowCompose] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [hasRecordedView, setHasRecordedView] = useState(false);
  const { data: session } = useSession();
  const isOwner = session?.user?.walletAddress === question.user.wallet;

  // Record view on mount (once per component lifecycle)
  useEffect(() => {
    if (hasRecordedView || !session?.user?.walletAddress) return;

    const recordView = async () => {
      try {
        const actionId = getActionViewNote();
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const signal = `${question.id}:${today}`;
        
        console.log('Recording view:', { questionId: question.id, signal });
        
        // Get World ID proof
        const proof = await getWorldIDProof(actionId, signal);
        
        // Send to backend
        const response = await fetch(`/api/notes/${question.id}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proof, signal }),
        });

        const data = await response.json();
        if (response.ok) {
          setViewCount(data.viewCount);
          setHasRecordedView(true);
          console.log('View recorded:', data);
        } else {
          // If already viewed today, that's fine
          if (data.message?.includes('Already viewed')) {
            setHasRecordedView(true);
          }
          console.log('View recording response:', data);
        }
      } catch (error) {
        console.error('Failed to record view:', error);
        // Don't block UI if view recording fails
      }
    };

    recordView();
  }, [question.id, session, hasRecordedView]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Question */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-base font-semibold text-gray-900 leading-relaxed mb-2">
              {question.text}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">{question.user.username || 'Anonymous'}</span>
              </div>
              <span>•</span>
              <span>{formatDate(question.createdAt)}</span>
            </div>
          </div>
        </div>
        
        {/* Engagement Stats */}
        <div className="flex items-center gap-2 mt-3">
          <LikeButton 
            noteId={question.id}
            initialLiked={false}
            initialCount={0}
          />
          {viewCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="font-medium">{viewCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Answers */}
      {question.answers.length > 0 ? (
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-gray-200" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {question.answers.length} Answer{question.answers.length !== 1 ? 's' : ''}
            </p>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          {question.answers.map((answer) => (
            <div
              key={answer.id}
              className={`p-3 rounded-xl transition-all ${
                question.acceptedId === answer.id
                  ? 'bg-emerald-50 border-2 border-emerald-500'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <p className="text-sm text-gray-800 leading-relaxed mb-2">{answer.text}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {answer.user.username || 'Anonymous'}
                </span>
                {question.acceptedId === answer.id && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Accepted Answer
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-xs text-gray-600 text-center">
            No answers yet. Be the first to help!
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2.5">
        {!showCompose && (
          <button
            onClick={() => setShowCompose(true)}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-4 rounded-xl border border-gray-300 hover:border-gray-400 active:scale-[0.98] transition-all"
          >
            {question.answers.length === 0 ? 'Be the first to answer' : 'Add your answer'}
          </button>
        )}

        {showCompose && (
          <ComposeAnswer
            questionId={question.id}
            onSuccess={() => {
              setShowCompose(false);
              onAnswerPosted();
            }}
            onCancel={() => setShowCompose(false)}
          />
        )}

        {isOwner && question.answers.length > 0 && !question.acceptedId && (
          <AcceptAnswerButton
            questionId={question.id}
            answers={question.answers}
            onAccepted={onAnswerPosted}
          />
        )}
      </div>
    </div>
  );
};

interface AcceptAnswerButtonProps {
  questionId: string;
  answers: Array<{ id: string; text: string }>;
  onAccepted: () => void;
}

const AcceptAnswerButton = ({
  questionId,
  answers,
  onAccepted,
}: AcceptAnswerButtonProps) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Single-flight lock: prevent multiple simultaneous accept requests
  const isAcceptingRef = useRef(false);

  const handleAccept = async (answerId: string) => {
    // Single-flight lock check
    if (isAcceptingRef.current) {
      console.warn('Accept already in progress, ignoring duplicate click');
      return;
    }

    // Set single-flight lock IMMEDIATELY
    isAcceptingRef.current = true;
    setIsAccepting(true);
    setError(null);

    // Generate unique request ID for tracking
    const requestId = `acc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${requestId}] Starting accept answer`);

    try {
      const action = process.env.NEXT_PUBLIC_ACTION_ACCEPT_ANSWER;
      if (!action) {
        throw new Error('Action ID not configured');
      }

      // Signal strategy: questionId only (one accept per question)
      const signal = questionId;

      console.log(`[${requestId}] Getting World ID proof for accept with action:`, action, 'signal:', signal);
      
      // Get FRESH proof from MiniKit (never reuse proofs)
      const proof = await getWorldIDProof(action, signal);
      
      // Log proof details before sending
      console.log(`[${requestId}] Got proof - nullifier:`, proof.nullifier_hash, 'signal:', signal);

      const res = await fetch('/api/accept', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-rid': requestId, // Request ID for server-side tracking
        },
        body: JSON.stringify({
          questionId,
          answerId,
          proof,
          signal, // Must match what was used during proof generation
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(`[${requestId}] Server error:`, data);
        if (data.error === 'replay' || data.error === 'replay_or_already_used') {
          throw new Error('Already accepted. This answer has already been accepted for this question.');
        }
        if (data.error === 'missing_signal') {
          throw new Error('Signal validation failed. Please try again.');
        }
        throw new Error(data.message || data.error || 'Failed to accept answer');
      }

      console.log(`[${requestId}] Answer accepted successfully`);

      onAccepted();
    } catch (err) {
      console.error(`[${requestId}] Failed to accept answer:`, err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to accept answer. Please try again.',
      );
    } finally {
      // Release single-flight lock
      isAcceptingRef.current = false;
      setIsAccepting(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-700">Accept an answer:</p>
      {answers.map((answer) => (
        <Button
          key={answer.id}
          variant="tertiary"
          size="sm"
          onClick={() => handleAccept(answer.id)}
          disabled={isAccepting}
          className="w-full text-left justify-start"
        >
          <span className="truncate">{answer.text.substring(0, 50)}...</span>
        </Button>
      ))}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
