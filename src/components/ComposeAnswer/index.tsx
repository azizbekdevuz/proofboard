"use client";

import { LiveFeedback } from "@worldcoin/mini-apps-ui-kit-react";
import { useState } from "react";
import { verifyAndConsume } from "@/components/verify";
import { fetchWithTimeout, FETCH_TIMEOUT_WRITE_MS } from "@/lib/network";
import type { ComposeAnswerProps } from "@/lib/types";

const MAX_ANSWER_CHARS = 500;

/**
 * ComposeAnswer – compact dark glass form.
 */
export const ComposeAnswer = ({
  questionId,
  onSuccess,
  onCancel,
}: ComposeAnswerProps) => {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError("Please enter an answer");
      return;
    }
    if (text.length > MAX_ANSWER_CHARS) {
      setError(`Answer must be ${MAX_ANSWER_CHARS} characters or less`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const action = process.env.NEXT_PUBLIC_ACTION_POST_ANSWER;
      if (!action) throw new Error("Action ID not configured");
      const proof = await verifyAndConsume(action, questionId);
      const res = await fetchWithTimeout(
        "/api/answers",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, text: text.trim(), proof }),
        },
        FETCH_TIMEOUT_WRITE_MS
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || data.error || "Failed to post answer");
      setText("");
      onSuccess();
    } catch (err) {
      console.error("Failed to post answer:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to post answer. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = MAX_ANSWER_CHARS - text.length;

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your answer..."
        maxLength={MAX_ANSWER_CHARS}
        rows={3}
        className="input-dark w-full p-3 resize-none text-sm"
      />

      <div className="flex items-center justify-between text-xs">
        <span
          className={
            remainingChars < 30
              ? "text-[var(--accent-rose)]"
              : "text-[var(--text-tertiary)]"
          }
        >
          {remainingChars} remaining
        </span>
      </div>

      {error && <p className="text-xs text-[var(--accent-rose)]">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="btn-ghost flex-1 py-3.5 text-sm"
        >
          Cancel
        </button>
        <LiveFeedback
          label={{
            pending: "Verifying...",
            failed: "Failed",
            success: "Posted!",
          }}
          state={isSubmitting ? "pending" : undefined}
        >
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !text.trim()}
            className="btn-accent flex-1 py-3.5 text-sm disabled:opacity-40"
          >
            Post Answer
          </button>
        </LiveFeedback>
      </div>
    </div>
  );
};
