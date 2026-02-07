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
    <div className="flex flex-col gap-4 p-5 border border-indigo-200 rounded-2xl bg-gradient-to-br from-indigo-50 to-white shadow-sm">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your answer..."
          maxLength={300}
          rows={4}
          className="w-full p-4 border-2 border-indigo-100 rounded-xl resize-none focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all text-sm placeholder:text-gray-400 bg-white"
        />
        <div className="absolute bottom-3 right-3">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            remainingChars < 20 
              ? 'bg-red-100 text-red-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {remainingChars}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
          <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-red-900">{error}</p>
        </div>
      )}

      <div className="flex gap-2.5">
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-2.5 px-4 rounded-xl border border-gray-200 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
        >
          Cancel
        </button>
        <LiveFeedback
          label={{
            pending: 'Verifying...',
            failed: 'Failed',
            success: 'Posted!',
          }}
          state={isSubmitting ? 'pending' : undefined}
          className="flex-1"
        >
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !text.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying...
              </>
            ) : (
              'Post Answer'
            )}
          </button>
        </LiveFeedback>
      </div>
    </div>
  );
};
