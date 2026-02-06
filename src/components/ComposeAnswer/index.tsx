'use client';

import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useState } from 'react';
import { verifyAndConsume } from '@/components/verify';

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

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('Please enter an answer');
      return;
    }

    if (text.length > 300) {
      setError('Answer must be 300 characters or less');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Verify World ID
      const action = process.env.NEXT_PUBLIC_ACTION_POST_ANSWER;
      if (!action) {
        throw new Error('Action ID not configured');
      }

      const proof = await verifyAndConsume(action, questionId);

      // Step 2: Post answer with proof
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          text: text.trim(),
          proof,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to post answer');
      }

      // Success!
      setText('');
      onSuccess();
    } catch (err) {
      console.error('Failed to post answer:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to post answer. Please try again.',
      );
    } finally {
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
