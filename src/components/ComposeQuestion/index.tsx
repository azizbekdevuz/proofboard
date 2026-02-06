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
    <div className="flex flex-col gap-4 p-4 border-2 border-gray-200 rounded-xl bg-white">
      <div>
        <h3 className="text-lg font-semibold mb-2">Post a Question</h3>
        <p className="text-sm text-gray-600 mb-3">
          Your question will be verified with World ID to prevent spam.
        </p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's on your mind? (max 300 characters)"
        maxLength={300}
        rows={4}
        className="w-full p-3 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500"
      />

      <div className="flex items-center justify-between text-sm">
        <span className={remainingChars < 20 ? 'text-red-500' : 'text-gray-500'}>
          {remainingChars} characters remaining
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="lg"
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
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting || !text.trim()}
            className="flex-1"
          >
            Post Question
          </Button>
        </LiveFeedback>
      </div>
    </div>
  );
};
