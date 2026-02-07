"use client";

import { LiveFeedback } from "@worldcoin/mini-apps-ui-kit-react";
import { useState } from "react";
import { verifyAndConsume } from "@/components/verify";
import { fetchWithTimeout, FETCH_TIMEOUT_WRITE_MS } from "@/lib/network";
import type { ComposeQuestionProps } from "@/lib/types";

/**
 * ComposeQuestion – dark glass form.
 */
export const ComposeQuestion = ({
  categoryId,
  onSuccess,
  onCancel,
}: ComposeQuestionProps) => {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError("Please enter a question");
      return;
    }
    if (text.length > 300) {
      setError("Question must be 300 characters or less");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const action = process.env.NEXT_PUBLIC_ACTION_POST_QUESTION;
      if (!action) throw new Error("Action ID not configured");
      const proof = await verifyAndConsume(action, categoryId);
      const res = await fetchWithTimeout(
        "/api/questions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId, text: text.trim(), proof }),
        },
        FETCH_TIMEOUT_WRITE_MS
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.message || data.error || "Failed to post question"
        );
      setText("");
      onSuccess();
    } catch (err) {
      console.error("Failed to post question:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to post question. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = 300 - text.length;

  return (
    <div className="flex flex-col gap-4 glass-card p-6">
      <div>
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
          Post a Question
        </h3>
        <p className="text-xs text-[var(--text-tertiary)]">
          Verified with World ID to prevent spam.
        </p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's on your mind?"
        maxLength={300}
        rows={4}
        className="input-dark w-full p-4 resize-none text-sm"
      />

      <div className="flex items-center justify-between text-xs">
        <span
          className={
            remainingChars < 20
              ? "text-[var(--accent-rose)]"
              : "text-[var(--text-tertiary)]"
          }
        >
          {remainingChars} characters remaining
        </span>
      </div>

      {error && <p className="text-xs text-[var(--accent-rose)]">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="btn-ghost flex-1 py-4 text-sm"
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
            className="btn-accent flex-1 py-4 text-sm disabled:opacity-40"
          >
            Post Question
          </button>
        </LiveFeedback>
      </div>
    </div>
  );
};
