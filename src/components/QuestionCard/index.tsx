"use client";

import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { useState } from "react";
import { Eye, Heart, ChatBubble } from "iconoir-react";
import { ComposeAnswer } from "@/components/ComposeAnswer";
import { useSession } from "next-auth/react";
import { verifyAndConsume } from "@/components/verify";
import { fetchWithTimeout, FETCH_TIMEOUT_WRITE_MS } from "@/lib/network";
import type {
  QuestionCardProps,
  QuestionNote,
  AcceptAnswerButtonProps,
} from "@/libs/types";

/**
 * QuestionCard component - Displays a question with its answers.
 * Shows compose answer form, accept answer button (owner, if no accepted yet), like button.
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
    <div className="border-2 border-yellow-200 rounded-xl p-4 bg-yellow-100/80 text-center">
      {/* Question */}
      <div className="mb-4">
        <p className="text-base font-medium text-gray-900 mb-1">
          {question.text}
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 flex-wrap">
          <span>{question.user.username || "Anonymous"}</span>
          <span>•</span>
          <span>{formatDate(question.createdAt)}</span>
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
          <span className="flex items-center gap-1" title="Answers">
            <ChatBubble className="w-4 h-4" />
            {question.answersNum ?? 0}
          </span>
        </div>
      </div>

      {/* Answers */}
      {question.answers && question.answers.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            {question.answers.length} Answer
            {question.answers.length !== 1 ? "s" : ""}:
          </p>
          {question.answers.map((answer) => (
            <div
              key={answer.id}
              className={`p-3 rounded-lg ${
                question.acceptedAnswerId === answer.id
                  ? "bg-green-100 border-2 border-green-400"
                  : "bg-white border border-gray-200"
              }`}
            >
              <p className="text-sm text-gray-900 mb-1">{answer.text}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {answer.user.username || "Anonymous"}
                </span>
                {question.acceptedAnswerId === answer.id && (
                  <span className="text-xs font-semibold text-green-600">
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
        {/* Only show compose if no accepted answer yet */}
        {!hasAccepted && !showCompose && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowCompose(true)}
            className="w-full"
          >
            {question.answersNum === 0
              ? "Be the first to answer"
              : "Add Answer"}
          </Button>
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

        {/* Accept answer: owner only, only if no accepted answer yet, and there are answers */}
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
      if (!action) {
        throw new Error("Action ID not configured");
      }

      const proof = await verifyAndConsume(action, questionId);

      const res = await fetchWithTimeout(
        "/api/accept",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId,
            answerId,
            proof,
          }),
        },
        FETCH_TIMEOUT_WRITE_MS
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || data.error || "Failed to accept answer"
        );
      }

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
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-700">Accept an answer:</p>
      {answers.map((answer) => (
        <Button
          key={answer.id}
          variant="tertiary"
          size="sm"
          onClick={() => handleAccept(answer.id)}
          disabled={isAccepting}
          className="w-full text-left justify-start"
        >
          <span className="truncate">{answer.text.substring(0, 50)}...</span>
        </Button>
      ))}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
