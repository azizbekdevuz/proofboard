"use client";

import { useState } from "react";
import { Eye, Heart, ChatBubble } from "iconoir-react";
import { ComposeAnswer } from "@/components/ComposeAnswer";
import { fetchWithTimeout } from "@/lib/network";
import type { PostDetailNote } from "@/lib/types";

export type { PostDetailNote };

/**
 * Post detail view – immersive dark design with depth.
 */
export function PostDetail({ question }: { question: PostDetailNote }) {
  const [showCompose, setShowCompose] = useState(false);
  const [localAnswers, setLocalAnswers] = useState(question.answers);
  const [localLikes, setLocalLikes] = useState(question.likesCount);
  const [isLiking, setIsLiking] = useState(false);

  const hasAccepted = question.acceptedAnswerId !== "";

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const handleCommentPosted = () => {
    setShowCompose(false);
    fetchWithTimeout(`/api/questions/${question.id}`)
      .then((r) => r.ok && r.json())
      .then((q) => q && setLocalAnswers(q.answers || []))
      .catch(() => {});
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
    <div className="flex flex-col flex-1 min-h-0 animate-fade-in-up">
      {/* Content */}
      <div className="p-6 border-b border-[var(--border-subtle)] text-center">
        <p className="text-base text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
          {question.text}
        </p>
        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-[var(--text-tertiary)] flex-wrap">
          <span>{question.user.username || "Anonymous"}</span>
          <span className="opacity-40">·</span>
          <span>{formatDate(question.createdAt)}</span>
          {question.categoryName && (
            <>
              <span className="opacity-40">·</span>
              <span className="text-[var(--accent-violet)]">
                {question.categoryName}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center justify-center gap-5 mt-3 text-xs text-[var(--text-tertiary)]">
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
        </div>
        {hasAccepted && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(52,211,153,0.12)] border border-[rgba(52,211,153,0.2)]">
            <span className="text-xs font-semibold text-[var(--accent-emerald)]">
              Accepted answer
            </span>
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <ChatBubble className="w-4 h-4 text-[var(--text-tertiary)]" />
          <p className="text-sm font-semibold text-[var(--text-secondary)]">
            {localAnswers.length} comment{localAnswers.length !== 1 ? "s" : ""}
          </p>
        </div>

        {localAnswers.map((answer) => (
          <div key={answer.id} className="glass-card p-6">
            <p className="text-xs text-[var(--text-tertiary)] mb-1.5">
              {answer.user.username || "Anonymous"}{" "}
              <span className="opacity-40">·</span>{" "}
              {formatDate(answer.createdAt)}
              {question.acceptedAnswerId === answer.id && (
                <span className="ml-2 text-[var(--accent-emerald)] font-semibold">
                  Accepted
                </span>
              )}
            </p>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">
              {answer.text}
            </p>
          </div>
        ))}

        {!hasAccepted && !showCompose && (
          <button
            type="button"
            onClick={() => setShowCompose(true)}
            className="btn-ghost w-full py-4 text-[var(--text-secondary)] text-sm"
          >
            Add comment
          </button>
        )}
        {showCompose && (
          <div className="mt-2">
            <ComposeAnswer
              questionId={question.id}
              onSuccess={handleCommentPosted}
              onCancel={() => setShowCompose(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
