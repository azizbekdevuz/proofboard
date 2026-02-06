'use client';

import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useState } from 'react';
import { verifyAndConsume } from '@/components/verify';
import { fetchWithTimeout, FETCH_TIMEOUT_WRITE_MS } from '@/lib/network';
import type { ComposeQuestionProps } from '@/libs/types';

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

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('Please enter a question');
      return;
    }

    if (text.length > 300) {
      setError('Question must be 300 characters or less');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Verify World ID
      const action = process.env.NEXT_PUBLIC_ACTION_POST_QUESTION;
      if (!action) {
        throw new Error('Action ID not configured');
      }

      const proof = await verifyAndConsume(action, categoryId);

      // Step 2: Post question with proof
      const res = await fetchWithTimeout(
        '/api/questions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId,
            text: text.trim(),
            proof,
          }),
        },
        FETCH_TIMEOUT_WRITE_MS
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to post question');
      }

      // Success!
      setText('');
      onSuccess();
    } catch (err) {
      console.error('Failed to post question:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to post question. Please try again.',
      );
    } finally {
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
