"use client";

import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Heart, ChatBubble } from "iconoir-react";
import { fetchWithTimeout, getResponseError, FETCH_TIMEOUT_WRITE_MS } from "@/lib/network";
import {
  getCategoryCardClasses,
  isQuestionUnread,
} from "@/lib/category-colors";
import type { MyQuestionNote, MyAnswerNote } from "@/libs/types";

/**
 * MyActivity component - Shows user's questions and answers.
 * Completed (accepted) questions are shown lower.
 * Users can archive their questions.
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
        setError(await getResponseError(questionsRes, "Could not load. Tap Retry."));
      }
      if (answersRes.ok) {
        const answersData = await answersRes.json();
        setMyAnswers(Array.isArray(answersData) ? answersData : []);
      } else {
        setMyAnswers([]);
        if (questionsRes.ok) setError(await getResponseError(answersRes, "Could not load. Tap Retry."));
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
      if (res.ok) {
        fetchMyActivity();
      }
    } catch (err) {
      console.error("Failed to archive:", err);
    } finally {
      setArchiving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500">Loading your activity...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <p className="text-gray-600 text-center text-sm">{error}</p>
        <Button variant="primary" size="lg" onClick={fetchMyActivity}>
          Retry
        </Button>
      </div>
    );
  }

  const hasActivity = myQuestions.length > 0 || myAnswers.length > 0;

  if (!hasActivity) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-gray-500 text-center">
          You haven't posted any questions or answers yet.
        </p>
        <p className="text-sm text-gray-400 text-center">
          Your activity — likes, posts, and stats — will show here.
        </p>
        <Button variant="primary" onClick={() => router.push("/categories")}>
          Browse categories
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {myQuestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">My Questions</h3>
          <div className="flex flex-col gap-2">
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
                  className={`${cardClasses} p-3 cursor-pointer transition-colors text-center hover:opacity-95 ${
                    isCompleted || isArch ? "opacity-75" : ""
                  }`}
                  onClick={() => router.push(`/question/${question.id}`)}
                >
                  <div className="flex flex-col gap-2 items-center">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {question.text}
                    </p>
                    <div className="flex items-center justify-center gap-3 text-xs text-gray-600 flex-wrap">
                      <span className="flex items-center gap-1" title="Answers">
                        <ChatBubble className="w-3.5 h-3.5" />
                        {question.answersNum ?? 0}
                      </span>
                      <span className="flex items-center gap-1" title="Likes">
                        <Heart className="w-3.5 h-3.5" />
                        {question.likesCount ?? 0}
                      </span>
                      {isCompleted && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 font-semibold">
                            Completed
                          </span>
                        </>
                      )}
                      {isArch && (
                        <>
                          <span>•</span>
                          <span className="text-gray-500 font-semibold">
                            Archived
                          </span>
                        </>
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
                        className="mt-1 text-xs text-gray-500 hover:text-gray-700 underline"
                      >
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
          <h3 className="text-lg font-semibold mb-3">My Answers</h3>
          <div className="flex flex-col gap-2">
            {myAnswers.map((answer) => (
              <div
                key={answer.id}
                className="border-2 rounded-xl p-3 cursor-pointer transition-colors bg-blue-50/90 border-blue-200 hover:bg-blue-100/90 text-center"
                onClick={() => router.push(`/question/${answer.question.id}`)}
              >
                <div className="flex flex-col gap-2 items-center">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {answer.text}
                  </p>
                  <div className="text-xs text-gray-600">
                    To: {answer.question.text.substring(0, 40)}...
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
