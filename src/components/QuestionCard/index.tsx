"use client";

import { useState } from "react";
import { Eye, Heart, ChatBubble } from "iconoir-react";
import { ComposeAnswer } from "@/components/ComposeAnswer";
import { useSession } from "next-auth/react";
import { verifyAndConsume } from "@/components/verify";
import { fetchWithTimeout, FETCH_TIMEOUT_WRITE_MS } from "@/lib/network";
import type { QuestionCardProps, AcceptAnswerButtonProps } from "@/lib/types";

/**
 * QuestionCard – dark glass card with answers inline.
 */
export const QuestionCard = ({
  question,
  onAnswerPosted,
}: QuestionCardProps) => {
  const [showCompose, setShowCompose] = useState(false);
  const [localLikes, setLocalLikes] = useState(question.likesCount);
  const [isLiking, setIsLiking] = useState(false);
  const { data: session } = useSession();
  const isOwner = session?.user?.walletAddress === question.user.wallet;
  const hasAccepted = question.acceptedAnswerId !== "";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleLike = async () => {
    setIsLiking(true);
    try {
      const res = await fetchWithTimeout("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setLocalLikes(data.likesCount);
      }
    } catch (err) {
      console.error("Failed to like:", err);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="glass-card p-6 text-center">
      {/* Question */}
      <div className="mb-4">
        <p className="text-base font-medium text-[var(--text-primary)] mb-2 leading-relaxed">
          {question.text}
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-tertiary)] flex-wrap">
          <span>{question.user.username || "Anonymous"}</span>
          <span className="opacity-40">·</span>
          <span>{formatDate(question.createdAt)}</span>
        </div>
        <div className="flex items-center justify-center gap-5 mt-2.5 text-xs text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1.5" title="Views">
            <Eye className="w-4 h-4" />
            {question.viewsCount ?? 0}
          </span>
          <button
            type="button"
            onClick={handleLike}
            disabled={isLiking}
            className="flex items-center gap-1.5 hover:text-[var(--accent-rose)] transition-colors"
            title="Like"
          >
            <Heart className="w-4 h-4" />
            {localLikes}
          </button>
          <span className="flex items-center gap-1.5" title="Answers">
            <ChatBubble className="w-4 h-4" />
            {question.answersNum ?? 0}
          </span>
        </div>
      </div>

      {/* Answers */}
      {question.answers && question.answers.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">
            {question.answers.length} Answer
            {question.answers.length !== 1 ? "s" : ""}
          </p>
          {question.answers.map((answer) => (
            <div
              key={answer.id}
              className={`p-3 rounded-[var(--card-radius-sm)] text-left ${
                question.acceptedAnswerId === answer.id
                  ? "bg-[rgba(52,211,153,0.08)] border border-[rgba(52,211,153,0.2)]"
                  : "bg-[var(--surface-1)] border border-[var(--border-subtle)]"
              }`}
            >
              <p className="text-sm text-[var(--text-primary)] mb-1 leading-relaxed">
                {answer.text}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-tertiary)]">
                  {answer.user.username || "Anonymous"}
                </span>
                {question.acceptedAnswerId === answer.id && (
                  <span className="text-xs font-semibold text-[var(--accent-emerald)]">
                    Accepted
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {!hasAccepted && !showCompose && (
          <button
            type="button"
            onClick={() => setShowCompose(true)}
            className="btn-ghost w-full py-3.5 text-sm text-[var(--accent-violet)]"
          >
            {question.answersNum === 0
              ? "Be the first to answer"
              : "Add Answer"}
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

        {isOwner &&
          !hasAccepted &&
          question.answers &&
          question.answers.length > 0 && (
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

const AcceptAnswerButton = ({
  questionId,
  answers,
  onAccepted,
}: AcceptAnswerButtonProps) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async (answerId: string) => {
    setIsAccepting(true);
    setError(null);

    try {
      const action = process.env.NEXT_PUBLIC_ACTION_ACCEPT_ANSWER;
      if (!action) throw new Error("Action ID not configured");
      const proof = await verifyAndConsume(action, questionId);
      const res = await fetchWithTimeout(
        "/api/accept",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, answerId, proof }),
        },
        FETCH_TIMEOUT_WRITE_MS
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.message || data.error || "Failed to accept answer"
        );
      onAccepted();
    } catch (err) {
      console.error("Failed to accept answer:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to accept answer. Please try again."
      );
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
      <p className="text-xs font-semibold text-[var(--text-secondary)]">
        Accept an answer:
      </p>
      {answers.map((answer) => (
        <button
          key={answer.id}
          type="button"
          onClick={() => handleAccept(answer.id)}
          disabled={isAccepting}
          className="btn-ghost w-full py-3 text-left text-sm px-4 text-[var(--text-secondary)]"
        >
          <span className="truncate block">
            {answer.text.substring(0, 50)}...
          </span>
        </button>
      ))}
      {error && <p className="text-xs text-[var(--accent-rose)]">{error}</p>}
    </div>
  );
};
