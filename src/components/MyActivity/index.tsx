"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Heart,
  ChatBubble,
  Archive,
  RefreshDouble,
  GridPlus,
} from "iconoir-react";
import {
  fetchWithTimeout,
  getResponseError,
  FETCH_TIMEOUT_WRITE_MS,
} from "@/lib/network";
import {
  getCategoryCardClasses,
  isQuestionUnread,
} from "@/lib/category-colors";
import type { MyQuestionNote, MyAnswerNote } from "@/lib/types";

/**
 * MyActivity – dark, clean activity feed.
 */
export const MyActivity = ({ wallet }: { wallet: string }) => {
  const [myQuestions, setMyQuestions] = useState<MyQuestionNote[]>([]);
  const [myAnswers, setMyAnswers] = useState<MyAnswerNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const router = useRouter();

  const fetchMyActivity = useCallback(async () => {
    if (!wallet) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [questionsRes, answersRes] = await Promise.all([
        fetchWithTimeout("/api/my/questions"),
        fetchWithTimeout("/api/my/answers"),
      ]);
      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        setMyQuestions(Array.isArray(questionsData) ? questionsData : []);
      } else {
        setMyQuestions([]);
        setError(
          await getResponseError(questionsRes, "Could not load. Tap Retry.")
        );
      }
      if (answersRes.ok) {
        const answersData = await answersRes.json();
        setMyAnswers(Array.isArray(answersData) ? answersData : []);
      } else {
        setMyAnswers([]);
        if (questionsRes.ok)
          setError(
            await getResponseError(answersRes, "Could not load. Tap Retry.")
          );
      }
    } catch (err) {
      console.error("Failed to fetch activity:", err);
      setError(
        err instanceof Error ? err.message : "Could not load. Tap Retry."
      );
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    if (wallet) fetchMyActivity();
  }, [wallet, fetchMyActivity]);

  const handleArchive = async (questionId: string) => {
    setArchiving(questionId);
    try {
      const res = await fetchWithTimeout(
        "/api/archive",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId }),
        },
        FETCH_TIMEOUT_WRITE_MS
      );
      if (res.ok) fetchMyActivity();
    } catch (err) {
      console.error("Failed to archive:", err);
    } finally {
      setArchiving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24 rounded-[var(--card-radius)]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-[var(--text-secondary)] text-center text-sm">
          {error}
        </p>
        <button
          type="button"
          onClick={fetchMyActivity}
          className="btn-accent px-6 py-4 flex items-center gap-2 text-sm"
        >
          <RefreshDouble className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  const hasActivity = myQuestions.length > 0 || myAnswers.length > 0;

  if (!hasActivity) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="text-4xl">📝</div>
        <p className="text-[var(--text-secondary)] text-center text-sm">
          You haven&apos;t posted anything yet.
        </p>
        <p className="text-xs text-[var(--text-tertiary)] text-center">
          Your questions, answers, and stats will show here.
        </p>
        <button
          type="button"
          onClick={() => router.push("/categories")}
          className="btn-accent px-6 py-4 flex items-center gap-2 text-sm"
        >
          <GridPlus className="w-4 h-4" />
          Browse categories
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {myQuestions.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
            My Questions
          </h3>
          <div className="flex flex-col gap-2 stagger-children">
            {myQuestions.map((question) => {
              const isCompleted = question.acceptedAnswerId !== "";
              const isArch = question.isArchived;
              const isUnread =
                !isCompleted &&
                !isArch &&
                isQuestionUnread(question.viewsCount ?? 0);
              const cardClasses = getCategoryCardClasses(
                question.category,
                isUnread,
                "question"
              );

              return (
                <div
                  key={question.id}
                  className={`${cardClasses} p-6 cursor-pointer transition-[border-color,box-shadow,opacity] duration-300 text-center hover:border-[var(--border-strong)] ${
                    isCompleted || isArch ? "opacity-60" : ""
                  }`}
                  onClick={() => router.push(`/question/${question.id}`)}
                >
                  <div className="flex flex-col gap-2 items-center">
                    <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 leading-snug">
                      {question.text}
                    </p>
                    <div className="flex items-center justify-center gap-3 text-xs text-[var(--text-tertiary)] flex-wrap">
                      <span className="flex items-center gap-1" title="Answers">
                        <ChatBubble className="w-3.5 h-3.5" />
                        {question.answersNum ?? 0}
                      </span>
                      <span className="flex items-center gap-1" title="Likes">
                        <Heart className="w-3.5 h-3.5" />
                        {question.likesCount ?? 0}
                      </span>
                      {isCompleted && (
                        <span className="px-2 py-0.5 rounded-full bg-[rgba(52,211,153,0.12)] text-[var(--accent-emerald)] font-semibold text-[11px]">
                          Completed
                        </span>
                      )}
                      {isArch && (
                        <span className="px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-tertiary)] font-semibold text-[11px]">
                          Archived
                        </span>
                      )}
                    </div>
                    {!isArch && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(question.id);
                        }}
                        disabled={archiving === question.id}
                        className="mt-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] flex items-center gap-1 transition-colors"
                      >
                        <Archive className="w-3 h-3" />
                        {archiving === question.id ? "Archiving..." : "Archive"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {myAnswers.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
            My Answers
          </h3>
          <div className="flex flex-col gap-2 stagger-children">
            {myAnswers.map((answer) => (
              <div
                key={answer.id}
                className="glass-card p-6 cursor-pointer text-center hover:border-[var(--border-medium)]"
                onClick={() => router.push(`/question/${answer.question.id}`)}
              >
                <div className="flex flex-col gap-2 items-center">
                  <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 leading-snug">
                    {answer.text}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Re: {answer.question.text.substring(0, 40)}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
