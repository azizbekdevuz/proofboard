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
    <div className="border-2 border-gray-200 rounded-xl p-4 bg-yellow-50">
      {/* Question */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className="text-base font-medium text-gray-900 mb-1">
              {question.text}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{question.user.username || 'Anonymous'}</span>
              <span>•</span>
              <span>{formatDate(question.createdAt)}</span>
            </div>
          </div>
        </div>
        
        {/* Engagement Stats */}
        <div className="flex items-center gap-4 mt-3">
          <LikeButton 
            noteId={question.id}
            initialLiked={false}
            initialCount={0}
          />
          {viewCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span>👁️</span>
              <span>{viewCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Answers */}
      {question.answers.length > 0 ? (
        <div className="mb-4 space-y-2">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            {question.answers.length} Answer{question.answers.length !== 1 ? 's' : ''}:
          </p>
          {question.answers.map((answer) => (
            <div
              key={answer.id}
              className={`p-3 rounded-lg ${
                question.acceptedId === answer.id
                  ? 'bg-green-100 border-2 border-green-400'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <p className="text-sm text-gray-900 mb-1">{answer.text}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {answer.user.username || 'Anonymous'}
                </span>
                {question.acceptedId === answer.id && (
                  <span className="text-xs font-semibold text-green-600">
                    ✓ Accepted
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            ⏳ Waiting for answers... Be the first to help!
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {!showCompose && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowCompose(true)}
            className="w-full"
          >
            {question.answers.length === 0 ? 'Be the first to answer' : 'Add Answer'}
          </Button>
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
