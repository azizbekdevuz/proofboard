"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Heart, ChatBubble } from "iconoir-react";
import { ComposeAnswer } from "@/components/ComposeAnswer";
import { fetchWithTimeout } from "@/lib/network";
import {
  getCategoryCardClasses,
  getCategoryLinkClasses,
  isQuestionUnread,
  isAnswerUnread,
} from "@/lib/category-colors";
import type { PostDetailNote } from "@/lib/types";

/**
 * Canvas-style question detail – immersive dark view with glowing cards.
 */
export function QuestionCanvas({ question }: { question: PostDetailNote }) {
  const router = useRouter();
  const [showCompose, setShowCompose] = useState(false);
  const [localAnswers, setLocalAnswers] = useState(question.answers);
  const [localLikes, setLocalLikes] = useState(question.likesCount);
  const [isLiking, setIsLiking] = useState(false);

  const hasAccepted = question.acceptedAnswerId !== "";
  const categoryId = question.category;

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
    <div className="flex flex-col flex-1 min-h-0 gap-5 pb-6 animate-fade-in-up">
      {/* Question card */}
      <div
        className={`p-6 text-center ${getCategoryCardClasses(
          categoryId,
          isQuestionUnread(question.viewsCount ?? 0),
          "question"
        )}`}
      >
        <p className="text-base text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
          {question.text}
        </p>
        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-[var(--text-tertiary)] flex-wrap">
          <span>{question.user.username || "Anonymous"}</span>
          <span className="opacity-40">·</span>
          <span>{formatDate(question.createdAt)}</span>
          {question.categoryName && categoryId && (
            <>
              <span className="opacity-40">·</span>
              <Link
                href={`/categories/${categoryId}`}
                className={getCategoryLinkClasses(categoryId)}
              >
                {question.categoryName}
              </Link>
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
            className="flex items-center gap-1.5 hover:text-[var(--accent-rose)] transition-colors duration-300"
            title="Like"
          >
            <Heart className="w-4 h-4" />
            {localLikes}
          </button>
        </div>
        {hasAccepted && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(5,150,105,0.12)] border border-[rgba(5,150,105,0.25)]">
            <span className="text-xs font-semibold text-[var(--accent-emerald)]">
              Accepted answer
            </span>
          </div>
        )}
      </div>

      {/* Answers */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ChatBubble className="w-4 h-4 text-[var(--text-tertiary)]" />
          <p className="text-sm font-semibold text-[var(--text-secondary)]">
            {localAnswers.length} answer{localAnswers.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="space-y-2 stagger-children">
          {localAnswers.map((answer) => {
            const isAccepted = question.acceptedAnswerId === answer.id;
            const answerUnread = isAnswerUnread(answer.createdAt);
            const answerCardClasses = isAccepted
              ? "rounded-[var(--card-radius)] border border-[rgba(5,150,105,0.3)] bg-[rgba(5,150,105,0.08)] backdrop-blur-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
              : `p-6 ${getCategoryCardClasses(
                  categoryId,
                  answerUnread,
                  "answer"
                )}`;
            return (
              <div
                key={answer.id}
                className={`${answerCardClasses} text-center`}
              >
                <p className="text-xs text-[var(--text-tertiary)] mb-2">
                  {answer.user.username || "Anonymous"}{" "}
                  <span className="opacity-40">·</span>{" "}
                  {formatDate(answer.createdAt)}
                  {isAccepted && (
                    <span className="ml-2 text-[var(--accent-emerald)] font-semibold">
                      Accepted
                    </span>
                  )}
                </p>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                  {answer.text}
                </p>
              </div>
            );
          })}
        </div>

        {!hasAccepted && !showCompose && (
          <button
            type="button"
            onClick={() => setShowCompose(true)}
            className="btn-ghost w-full py-4 px-5 text-[var(--accent-violet)] text-sm font-medium"
          >
            Add answer
          </button>
        )}
        {showCompose && (
          <div className="glass-card p-6">
            <ComposeAnswer
              questionId={question.id}
              onSuccess={handleCommentPosted}
              onCancel={() => setShowCompose(false)}
            />
          </div>
        )}
      </div>

      {/* Footer links */}
      <div className="flex flex-wrap gap-4 pt-3 border-t border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={() => router.push("/home/answer")}
          className="text-sm font-medium text-[var(--accent-violet)] hover:underline"
        >
          Answer another
        </button>
        <Link
          href="/categories"
          className="text-sm font-medium text-[var(--accent-emerald)] hover:underline"
        >
          Browse categories
        </Link>
      </div>
    </div>
  );
}
