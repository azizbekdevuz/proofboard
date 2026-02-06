/**
 * App-wide types and interfaces.
 */

import type { ReactNode } from "react";
import type { ISuccessResult } from "@worldcoin/minikit-js";
import type { Session } from "next-auth";
import type { NoteType } from "@/libs/enums";

// ── Category ─────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
}

export interface CategoryWithCount extends Category {
  _count: { questions: number };
}

// ── User ─────────────────────────────────────────────────────────────────

export interface NoteUser {
  username: string | null;
  wallet: string;
}

// ── Note / Post ───────────────────────────────────────────────────────────

export interface FakeNote {
  id: string;
  category: string;
  type: NoteType;
  referenceId: string;
  text: string;
  userId: string;
  viewsCount: number;
  likesCount: number;
  answersNum: number;
  acceptedAnswerId: string;
  isArchived: boolean;
  createdAt: string;
  user: NoteUser;
}

export interface PostCardNote {
  id: string;
  text: string;
  category: string;
  categoryName?: string;
  type: NoteType;
  referenceId: string;
  viewsCount: number;
  likesCount: number;
  answersNum: number;
  acceptedAnswerId: string;
  createdAt: string;
}

export interface AnswerItem {
  id: string;
  text: string;
  createdAt: string;
  viewsCount?: number;
  likesCount?: number;
  acceptedAnswerId?: string;
  user: NoteUser;
}

export interface PostDetailNote {
  id: string;
  text: string;
  category: string;
  categoryName?: string;
  type: NoteType;
  referenceId: string;
  viewsCount: number;
  likesCount: number;
  answersNum: number;
  acceptedAnswerId: string;
  createdAt: string;
  user: NoteUser;
  answers: AnswerItem[];
}

export interface QuestionNote {
  id: string;
  text: string;
  category: string;
  type: "QUESTION";
  referenceId: string;
  viewsCount: number;
  likesCount: number;
  answersNum: number;
  acceptedAnswerId: string;
  createdAt: string;
  user: NoteUser;
  answers: Array<{
    id: string;
    text: string;
    createdAt: string;
    user: NoteUser;
  }>;
}

export interface MyQuestionNote {
  id: string;
  text: string;
  category: string;
  type: "QUESTION";
  viewsCount: number;
  likesCount: number;
  answersNum: number;
  acceptedAnswerId: string;
  isArchived: boolean;
  createdAt: string;
}

export interface MyAnswerNote {
  id: string;
  text: string;
  category: string;
  type: "ANSWER";
  referenceId: string;
  viewsCount: number;
  likesCount: number;
  createdAt: string;
  question: { id: string; text: string; category: string };
}

// ── Component props ───────────────────────────────────────────────────────

export interface ComposeAnswerProps {
  questionId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export interface ComposeQuestionProps {
  categoryId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export interface QuestionCardProps {
  question: QuestionNote;
  onAnswerPosted: () => void;
}

export interface AcceptAnswerButtonProps {
  questionId: string;
  answers: Array<{ id: string; text: string }>;
  onAccepted: () => void;
}

export interface ClientProvidersProps {
  children: ReactNode;
  session: Session | null;
}

export interface MiniKitErrorBoundaryProps {
  children: ReactNode;
}

export interface MiniKitErrorBoundaryState {
  error: Error | null;
}

// ── API / Verify ──────────────────────────────────────────────────────────

export interface VerifyRequestPayload {
  payload: ISuccessResult;
  action: string;
  signal?: string;
}
