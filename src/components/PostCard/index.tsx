"use client";

import { useRouter } from "next/navigation";
import { Eye, Heart, ChatBubble } from "iconoir-react";
import type { PostCardNote } from "@/lib/types";
import {
  getCategoryCardClasses,
  getCategoryMetaClasses,
  isQuestionUnread,
} from "@/lib/category-colors";

export type { PostCardNote };

/**
 * Compact post card – dark glass with category tint. Tap to open.
 */
export const PostCard = ({ question }: { question: PostCardNote }) => {
  const router = useRouter();
  const preview =
    question.text.slice(0, 80) + (question.text.length > 80 ? "…" : "");
  const isUnread = isQuestionUnread(question.viewsCount ?? 0);
  const cardClasses = getCategoryCardClasses(
    question.category,
    isUnread,
    "question"
  );

  return (
    <button
      type="button"
      onClick={() => router.push(`/question/${question.id}`)}
      className={`relative flex flex-col w-full aspect-square min-h-[110px] ${cardClasses} hover:border-[var(--border-strong)] active:scale-[0.97] transition-[transform,border-color,box-shadow] duration-300 text-center p-6 overflow-hidden items-center justify-between`}
    >
      {/* Unread dot */}
      {isUnread && (
        <div className="absolute top-3 right-3 glow-dot" />
      )}

      <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-3 flex-1 flex items-center justify-center leading-snug">
        {preview}
      </p>

      <div
        className={`flex items-center justify-center gap-3 text-xs shrink-0 ${getCategoryMetaClasses(question.category)}`}
      >
        <span className="flex items-center gap-1 opacity-70" title="Views">
          <Eye className="w-3.5 h-3.5" />
          {question.viewsCount ?? 0}
        </span>
        <span className="flex items-center gap-1 opacity-70" title="Likes">
          <Heart className="w-3.5 h-3.5" />
          {question.likesCount ?? 0}
        </span>
        <span className="flex items-center gap-1 opacity-70" title="Answers">
          <ChatBubble className="w-3.5 h-3.5" />
          {question.answersNum ?? 0}
        </span>
      </div>

      {question.categoryName && (
        <span
          className={`text-[11px] truncate max-w-full font-medium mt-1 opacity-60 ${getCategoryMetaClasses(question.category)}`}
        >
          {question.categoryName}
        </span>
      )}
    </button>
  );
};
