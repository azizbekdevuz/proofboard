"use client";

import { useRouter } from "next/navigation";
import { Eye, Heart, ChatBubble } from "iconoir-react";
import type { PostCardNote } from "@/libs/types";
import {
  getCategoryCardClasses,
  getCategoryMetaClasses,
  isQuestionUnread,
} from "@/lib/category-colors";

export type { PostCardNote };

/**
 * Compact post card for grid layout - tap to open post detail.
 * Color by category; unread (bright) when viewsCount <= 1. No images; centered text; icons + counts only.
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
      className={`flex flex-col w-full aspect-square min-h-[100px] ${cardClasses} hover:opacity-95 active:scale-[0.98] transition text-center p-3 overflow-hidden items-center justify-between`}
    >
      <p className="text-sm font-medium text-gray-900 line-clamp-3 flex-1 flex items-center justify-center">
        {preview}
      </p>
      <div
        className={`flex items-center justify-center gap-3 text-xs shrink-0 ${getCategoryMetaClasses(question.category)}`}
      >
        <span className="flex items-center gap-1" title="Views">
          <Eye className="w-3.5 h-3.5" />
          {question.viewsCount ?? 0}
        </span>
        <span className="flex items-center gap-1" title="Likes">
          <Heart className="w-3.5 h-3.5" />
          {question.likesCount ?? 0}
        </span>
        <span className="flex items-center gap-1" title="Answers">
          <ChatBubble className="w-3.5 h-3.5" />
          {question.answersNum ?? 0}
        </span>
      </div>
      {question.categoryName && (
        <span
          className={`text-xs truncate max-w-full font-medium mt-0.5 ${getCategoryMetaClasses(question.category)}`}
        >
          {question.categoryName}
        </span>
      )}
    </button>
  );
};
