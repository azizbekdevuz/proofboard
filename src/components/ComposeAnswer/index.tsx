'use client';

import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useState, useRef } from 'react';
import { getWorldIDProof } from '@/components/verify';

interface ComposeAnswerProps {
  questionId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * ComposeAnswer component - Form to post an answer to a question
 * Requires World ID verification before posting
 */
export const ComposeAnswer = ({
  questionId,
  onSuccess,
  onCancel,
}: ComposeAnswerProps) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Single-flight lock: prevent multiple simultaneous submissions
  const isSubmittingRef = useRef(false);

  const handleSubmit = async () => {
    // Single-flight lock check
    if (isSubmittingRef.current) {
      console.warn('Submit already in progress, ignoring duplicate click');
      return;
    }

    if (!text.trim()) {
      setError('Please enter an answer');
      return;
    }

    if (text.length > 300) {
      setError('Answer must be 300 characters or less');
      return;
    }

    // Set single-flight lock IMMEDIATELY
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    // Generate unique request ID for tracking
    const requestId = `a-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${requestId}] Starting answer submission`);

    try {
      // Get World ID proof
      const action = process.env.NEXT_PUBLIC_ACTION_POST_ANSWER;
      if (!action) {
        throw new Error('Action ID not configured');
      }

      // Signal strategy: questionId + date (allows multiple answers per question per day)
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const signal = `${questionId}:${today}`;

      console.log(`[${requestId}] Getting World ID proof for answer with action:`, action, 'signal:', signal);
      
      // Get FRESH proof from MiniKit (never reuse proofs)
      const proof = await getWorldIDProof(action, signal);
      
      // Log proof details before sending
      console.log(`[${requestId}] Got proof - nullifier:`, proof.nullifier_hash, 'signal:', signal);

      // Post answer with proof (server will verify + store nullifier atomically)
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-rid': requestId, // Request ID for server-side tracking
        },
        body: JSON.stringify({
          questionId,
          text: text.trim(),
          proof,
          signal, // Must match what was used during proof generation
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(`[${requestId}] Server error:`, data);
        if (data.error === 'replay' || data.error === 'replay_or_already_used') {
          throw new Error('Already used for this question today. Please try again tomorrow.');
        }
        if (data.error === 'missing_signal') {
          throw new Error('Signal validation failed. Please try again.');
        }
        throw new Error(data.message || data.error || 'Failed to post answer');
      }

      console.log(`[${requestId}] Answer created successfully:`, data.id);

      // Success!
      setText('');
      onSuccess();
    } catch (err) {
      console.error(`[${requestId}] Failed to post answer:`, err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to post answer. Please try again.',
      );
    } finally {
      // Release single-flight lock
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const remainingChars = 300 - text.length;

  return (
    <div className="flex flex-col gap-3 p-3 border-2 border-blue-200 rounded-lg bg-blue-50">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your answer... (max 300 characters)"
        maxLength={300}
        rows={3}
        className="w-full p-2 border-2 border-blue-300 rounded-lg resize-none focus:outline-none focus:border-blue-500"
      />

      <div className="flex items-center justify-between text-xs">
        <span className={remainingChars < 20 ? 'text-red-500' : 'text-gray-500'}>
          {remainingChars} remaining
        </span>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <LiveFeedback
          label={{
            pending: 'Verifying...',
            failed: 'Failed',
            success: 'Posted!',
          }}
          state={isSubmitting ? 'pending' : undefined}
        >
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !text.trim()}
            className="flex-1"
          >
            Post Answer
          </Button>
        </LiveFeedback>
      </div>
    </div>
  );
};
