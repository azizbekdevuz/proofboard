"use client";

import { useState } from "react";
import { Eye, Heart } from "iconoir-react";
import { ComposeAnswer } from "@/components/ComposeAnswer";
import { fetchWithTimeout } from "@/lib/network";
import type { PostDetailNote } from "@/libs/types";

export type { PostDetailNote };

/**
 * Post detail view - Media placeholder, content, comments, Add comment, like
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
    <div className="flex flex-col flex-1 min-h-0">
      {/* Content - no media */}
      <div className="p-6 border-b border-gray-200 text-center">
        <p className="text-base text-gray-900 whitespace-pre-wrap">
          {question.text}
        </p>
        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-500 flex-wrap">
          <span>{question.user.username || "Anonymous"}</span>
          <span>·</span>
          <span>{formatDate(question.createdAt)}</span>
          {question.categoryName && (
            <>
              <span>·</span>
              <span>{question.categoryName}</span>
            </>
          )}
        </div>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1" title="Views">
            <Eye className="w-4 h-4" />
            {question.viewsCount ?? 0}
          </span>
          <button
            type="button"
            onClick={handleLike}
            disabled={isLiking}
            className="flex items-center gap-1 hover:text-red-500 transition-colors"
            title="Like"
          >
            <Heart className="w-4 h-4" />
            {localLikes}
          </button>
        </div>
        {hasAccepted && (
          <p className="mt-2 text-xs font-semibold text-green-600">
            This question has an accepted answer
          </p>
        )}
      </div>

      {/* Comments */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        <p className="text-sm font-semibold text-gray-700">
          {localAnswers.length} comment{localAnswers.length !== 1 ? "s" : ""}
        </p>
        {localAnswers.map((answer) => (
          <div key={answer.id} className="flex gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">
                {answer.user.username || "Anonymous"} ·{" "}
                {formatDate(answer.createdAt)}
                {question.acceptedAnswerId === answer.id && (
                  <span className="ml-2 text-green-600 font-semibold">
                    Accepted
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-900">{answer.text}</p>
            </div>
          </div>
        ))}

        {/* Add comment - only if no accepted answer yet */}
        {!hasAccepted && !showCompose && (
          <button
            type="button"
            onClick={() => setShowCompose(true)}
            className="w-full mt-2 py-3 px-6 rounded-xl border-2 border-gray-200 text-left text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition"
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
