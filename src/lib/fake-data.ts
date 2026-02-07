/**
 * Fake data for running the app without a database (USE_FAKE_DATA=true).
 * In-memory store holds runtime-added notes until process restart.
 *
 * Data model (mirrors Prisma Note):
 *   id, category, type (QUESTION | ANSWER), referenceId ("" for questions,
 *   question-note id for answers), text, viewsCount, likesCount,
 *   answersNum (number for questions, 0 for answers),
 *   acceptedAnswerId ("" = none, for questions only),
 *   isArchived (boolean, for questions only).
 */

import type { FakeNote } from "@/lib/types";
import { NoteType } from "@/lib/enums";

export { NoteType };
export type { FakeNote };

// ── Static seed data ────────────────────────────────────────────────────

const FAKE_USER = {
  username: "Demo User",
  wallet: "0x0000000000000000000000000000000000000000",
};

const FAKE_NOTES_STATIC: FakeNote[] = [
  // Questions
  {
    id: "q-1",
    category: "cat-dating",
    type: "QUESTION",
    referenceId: "",
    text: "What's the best way to stay motivated when learning something new?",
    userId: "u-1",
    viewsCount: 12,
    likesCount: 3,
    answersNum: 2,
    acceptedAnswerId: "ans-1", // has accepted answer → archived from board
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    user: { ...FAKE_USER },
  },
  {
    id: "q-2",
    category: "cat-family",
    type: "QUESTION",
    referenceId: "",
    text: "How do you balance work and life when both feel overwhelming?",
    userId: "u-2",
    viewsCount: 24,
    likesCount: 7,
    answersNum: 1,
    acceptedAnswerId: "",
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    user: { username: "Taylor", wallet: "0x1111" },
  },
  {
    id: "q-3",
    category: "cat-self",
    type: "QUESTION",
    referenceId: "",
    text: "What's a simple habit that improved your daily routine?",
    userId: "u-3",
    viewsCount: 5,
    likesCount: 1,
    answersNum: 0,
    acceptedAnswerId: "",
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    user: { username: "Casey", wallet: "0x2222" },
  },
  {
    id: "q-4",
    category: "cat-crypto",
    type: "QUESTION",
    referenceId: "",
    text: "Best tools for staying productive as a remote team?",
    userId: "u-4",
    viewsCount: 8,
    likesCount: 2,
    answersNum: 0,
    acceptedAnswerId: "",
    isArchived: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    user: { username: "Morgan", wallet: "0x3333" },
  },
  {
    id: "q-5",
    category: "cat-other",
    type: "QUESTION",
    referenceId: "",
    text: "If you could have dinner with anyone, who and why?",
    userId: "u-5",
    viewsCount: 15,
    likesCount: 4,
    answersNum: 0,
    acceptedAnswerId: "",
    isArchived: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    user: { username: "Riley", wallet: "0x4444" },
  },
  {
    id: "q-6",
    category: "cat-business",
    type: "QUESTION",
    referenceId: "",
    text: "What book or course would you recommend for beginners in your field?",
    userId: "u-6",
    viewsCount: 10,
    likesCount: 5,
    answersNum: 0,
    acceptedAnswerId: "",
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    user: { username: "Avery", wallet: "0x5555" },
  },
  {
    id: "q-7",
    category: "cat-self",
    type: "QUESTION",
    referenceId: "",
    text: "How do you handle disagreement in a team without conflict?",
    userId: "u-7",
    viewsCount: 6,
    likesCount: 0,
    answersNum: 0,
    acceptedAnswerId: "",
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    user: { username: "Quinn", wallet: "0x6666" },
  },

  // Answers
  {
    id: "ans-1",
    category: "cat-dating",
    type: "ANSWER",
    referenceId: "q-1",
    text: "Start with small projects and ship often. Consistency beats intensity.",
    userId: "u-8",
    viewsCount: 4,
    likesCount: 2,
    answersNum: 0,
    acceptedAnswerId: "",
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    user: { username: "Alex", wallet: "0x7777" },
  },
  {
    id: "ans-2",
    category: "cat-family",
    type: "ANSWER",
    referenceId: "q-2",
    text: "Take breaks, talk to people you trust, and remember it's okay to not have everything figured out.",
    userId: "u-9",
    viewsCount: 6,
    likesCount: 3,
    answersNum: 0,
    acceptedAnswerId: "",
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    user: { username: "Jordan", wallet: "0x8888" },
  },
  {
    id: "ans-3",
    category: "cat-dating",
    type: "ANSWER",
    referenceId: "q-1",
    text: "Focus on one thing at a time. Deep work beats multitasking.",
    userId: "u-10",
    viewsCount: 3,
    likesCount: 1,
    answersNum: 0,
    acceptedAnswerId: "",
    isArchived: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    user: { username: "Sam", wallet: "0x9999" },
  },
];

// ── Runtime store ───────────────────────────────────────────────────────

const runtimeNotes: FakeNote[] = [];
let nextId = 200;

function allNotes(): FakeNote[] {
  return [...FAKE_NOTES_STATIC, ...runtimeNotes];
}

// ── Public helpers ──────────────────────────────────────────────────────

/**
 * Get question notes for the board (excludes accepted questions).
 * Optionally filtered by category.
 */
export function getBoardQuestions(categoryId: string | null): FakeNote[] {
  const notes = allNotes().filter(
    (n) => n.type === "QUESTION" && n.acceptedAnswerId === ""
  );
  const sorted = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  if (categoryId) {
    return sorted.filter((n) => n.category === categoryId);
  }
  return sorted.slice(0, 50);
}

/**
 * Get past/archive questions (those with an accepted answer).
 * Sorted by likesCount DESC so more-liked questions appear higher.
 */
export function getArchiveQuestions(categoryId: string | null): FakeNote[] {
  const notes = allNotes().filter(
    (n) => n.type === "QUESTION" && n.acceptedAnswerId !== ""
  );
  const sorted = [...notes].sort((a, b) => b.likesCount - a.likesCount);
  if (categoryId) {
    return sorted.filter((n) => n.category === categoryId);
  }
  return sorted.slice(0, 50);
}

/** Get a single note by id. */
export function getNoteById(id: string): FakeNote | undefined {
  return allNotes().find((n) => n.id === id);
}

/** Get all answer-type notes for a given question note. */
export function getAnswersForQuestion(questionId: string): FakeNote[] {
  return allNotes()
    .filter((n) => n.type === "ANSWER" && n.referenceId === questionId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

/**
 * Get the user's QUESTION notes.
 * Completed (accepted) questions are pushed to the bottom.
 * Archived questions are also pushed lower.
 */
export function getMyQuestions(wallet: string): FakeNote[] {
  return allNotes()
    .filter((n) => n.type === "QUESTION" && n.user.wallet === wallet)
    .sort((a, b) => {
      // Active (no accepted answer, not archived) come first
      const aCompleted = a.acceptedAnswerId !== "" || a.isArchived ? 1 : 0;
      const bCompleted = b.acceptedAnswerId !== "" || b.isArchived ? 1 : 0;
      if (aCompleted !== bCompleted) return aCompleted - bCompleted;
      // Within same group, newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

/** Get the user's ANSWER notes, enriched with a reference to the question text. */
export function getMyAnswers(
  wallet: string
): Array<
  FakeNote & { question: { id: string; text: string; category: string } }
> {
  const notes = allNotes();
  return notes
    .filter((n) => n.type === "ANSWER" && n.user.wallet === wallet)
    .map((n) => {
      const q = notes.find((x) => x.id === n.referenceId);
      return {
        ...n,
        question: {
          id: q?.id ?? n.referenceId,
          text: q?.text ?? "",
          category: q?.category ?? n.category,
        },
      };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

/** Add a new QUESTION note. */
export function addQuestion(params: {
  category: string;
  text: string;
  wallet: string;
  username?: string | null;
}): FakeNote {
  const id = `note-${nextId++}`;
  const note: FakeNote = {
    id,
    category: params.category,
    type: "QUESTION",
    referenceId: "",
    text: params.text,
    userId: params.wallet,
    viewsCount: 0,
    likesCount: 0,
    answersNum: 0,
    acceptedAnswerId: "",
    isArchived: false,
    createdAt: new Date().toISOString(),
    user: { username: params.username ?? "Anonymous", wallet: params.wallet },
  };
  runtimeNotes.push(note);
  return note;
}

/** Add a new ANSWER note and bump the question's answersNum. */
export function addAnswer(params: {
  questionId: string;
  text: string;
  wallet: string;
  username?: string | null;
}): FakeNote | undefined {
  const question = getNoteById(params.questionId);
  if (!question || question.type !== "QUESTION") return undefined;

  const id = `note-${nextId++}`;
  const note: FakeNote = {
    id,
    category: question.category,
    type: "ANSWER",
    referenceId: params.questionId,
    text: params.text,
    userId: params.wallet,
    viewsCount: 0,
    likesCount: 0,
    answersNum: 0,
    acceptedAnswerId: "",
    isArchived: false,
    createdAt: new Date().toISOString(),
    user: { username: params.username ?? "Anonymous", wallet: params.wallet },
  };
  runtimeNotes.push(note);

  // Bump answersNum on the question
  question.answersNum += 1;

  return note;
}

/** Accept an answer for a question (only one accepted answer allowed). */
export function acceptAnswerFake(
  questionId: string,
  answerId: string
): boolean {
  const q = allNotes().find(
    (n) => n.id === questionId && n.type === "QUESTION"
  );
  if (!q) return false;
  if (q.acceptedAnswerId !== "") return false; // already has an accepted answer
  const a = allNotes().find(
    (n) =>
      n.id === answerId && n.type === "ANSWER" && n.referenceId === questionId
  );
  if (!a) return false;
  q.acceptedAnswerId = answerId;
  return true;
}

/** Like a question (increment likesCount). */
export function likeQuestionFake(questionId: string): boolean {
  const q = allNotes().find(
    (n) => n.id === questionId && n.type === "QUESTION"
  );
  if (!q) return false;
  q.likesCount += 1;
  return true;
}

/** Archive a question (owner sets isArchived = true). */
export function archiveQuestionFake(questionId: string): boolean {
  const q = allNotes().find(
    (n) => n.id === questionId && n.type === "QUESTION"
  );
  if (!q) return false;
  q.isArchived = true;
  return true;
}

export function isFakeDataEnabled(): boolean {
  return process.env.USE_FAKE_DATA === "true";
}
