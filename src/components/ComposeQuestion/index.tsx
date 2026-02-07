'use client';

import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useState, useRef } from 'react';
import { getWorldIDProof } from '@/components/verify';

interface ComposeQuestionProps {
  categoryId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * ComposeQuestion component - Form to post a new question
 * Requires World ID verification before posting
 */
export const ComposeQuestion = ({
  categoryId,
  onSuccess,
  onCancel,
}: ComposeQuestionProps) => {
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
      setError('Please enter a question');
      return;
    }

    if (text.length > 300) {
      setError('Question must be 300 characters or less');
      return;
    }

    // Set single-flight lock IMMEDIATELY
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    // Generate unique request ID for tracking
    const requestId = `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${requestId}] Starting question submission`);

    try {
      // Get World ID proof (client-side verification only)
      const action = process.env.NEXT_PUBLIC_ACTION_POST_QUESTION;
      if (!action) {
        throw new Error('Action ID not configured. Please set NEXT_PUBLIC_ACTION_POST_QUESTION in your environment variables.');
      }

      // Signal strategy: categoryId + date (allows multiple questions per category per day)
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const signal = `${categoryId}:${today}`;

      console.log(`[${requestId}] Getting World ID proof with action:`, action, 'signal:', signal);
      
      // Get FRESH proof from MiniKit (never reuse proofs)
      const proof = await getWorldIDProof(action, signal);
      
      // Log proof details before sending
      console.log(`[${requestId}] Got proof - nullifier:`, proof.nullifier_hash, 'signal:', signal);

      // Post question with proof (server will verify + store nullifier atomically)
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-rid': requestId, // Request ID for server-side tracking
        },
        body: JSON.stringify({
          categoryId,
          text: text.trim(),
          proof,
          signal, // Must match what was used during proof generation
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(`[${requestId}] Server error:`, data);
        // Handle specific error codes
        if (data.error === 'replay' || data.error === 'replay_or_already_used') {
          throw new Error('Already used for this category today. Please try again tomorrow or choose a different category.');
        }
        if (data.error === 'missing_signal') {
          throw new Error('Signal validation failed. Please try again.');
        }
        throw new Error(data.message || data.error || 'Failed to post question');
      }

      console.log(`[${requestId}] Question created successfully:`, data.id);

      // Success!
      setText('');
      onSuccess();
    } catch (err) {
      console.error(`[${requestId}] Failed to post question:`, err);
      
      // Extract more detailed error information
      let errorMessage = 'Failed to post question. Please try again.';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        const errorObj = err as any;
        errorMessage = errorObj.message || errorObj.error || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      // Release single-flight lock
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const remainingChars = 300 - text.length;

  return (
    <div className="flex flex-col gap-5 p-6 border border-gray-200 rounded-3xl bg-white shadow-lg">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Post a Question</h3>
        <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
          <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="text-sm text-indigo-900 leading-relaxed">
            <span className="font-semibold">Human-verified only.</span> Your question will be verified with World ID.
          </p>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          maxLength={300}
          rows={5}
          className="w-full p-4 border-2 border-gray-200 rounded-2xl resize-none focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-base placeholder:text-gray-400"
        />
        <div className="absolute bottom-3 right-3">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            remainingChars < 20 
              ? 'bg-red-100 text-red-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {remainingChars} left
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3.5 px-6 rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying...
              </>
            ) : (
              'Post Question'
            )}
          </button>
        </LiveFeedback>
      </div>
    </div>
  );
};
