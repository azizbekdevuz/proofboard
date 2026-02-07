/**
 * Raw SQL CRUD for notes, likes, and views.
 * Uses Prisma $queryRaw / $executeRaw with parameterized queries.
 */

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/** Note row as returned by raw SQL (snake_case from DB may vary; Prisma uses camelCase in schema) */
export interface NoteRow {
  id: string;
  category: string;
  type: string;
  referenceId: string;
  text: string;
  userId: string;
  viewsCount: number;
  likesCount: number;
  answersNum: number;
  acceptedAnswerId: string;
  isArchived: boolean;
  createdAt: Date;
}

/** Note with user fields (username, wallet) for API responses */
export interface NoteWithUser extends NoteRow {
  user_username: string | null;
  user_wallet: string;
}

/** Map NoteWithUser to API shape: { ...note, user: { username, wallet } } */
export function toNoteApiResponse(n: NoteWithUser) {
  const { user_username, user_wallet, ...rest } = n;
  return { ...rest, user: { username: user_username, wallet: user_wallet } };
}

/** User row for joins */
export interface UserRow {
  id: string;
  wallet: string;
  username: string | null;
  createdAt: Date;
}

// ---------- Notes (CRUD) ----------

/** Create a QUESTION note. Returns the created note with user. */
export async function createQuestion(params: {
  userId: string;
  category: string;
  text: string;
}): Promise<NoteWithUser | null> {
  const inserted = await db.$queryRaw<NoteRow[]>(
    Prisma.sql`
      INSERT INTO "Note" (
        "id", "category", "type", "referenceId", "text", "userId",
        "viewsCount", "likesCount", "answersNum", "acceptedAnswerId", "isArchived", "createdAt"
      )
      VALUES (
        gen_random_uuid()::text, ${params.category}, 'QUESTION', '', ${params.text}, ${params.userId},
        0, 0, 0, '', false, NOW()
      )
      RETURNING *
    `
  );
  const note = inserted[0];
  if (!note) return null;
  const users = await db.$queryRaw<UserRow[]>(
    Prisma.sql`SELECT id, wallet, username, "createdAt" FROM "User" WHERE id = ${note.userId}`
  );
  const user = users[0];
  if (!user) return null;
  return {
    ...note,
    user_username: user.username,
    user_wallet: user.wallet,
  };
}

/** Create an ANSWER note and return it with user. */
export async function createAnswer(params: {
  userId: string;
  questionId: string;
  category: string;
  text: string;
}): Promise<NoteWithUser | null> {
  const inserted = await db.$queryRaw<NoteRow[]>(
    Prisma.sql`
      INSERT INTO "Note" (
        "id", "category", "type", "referenceId", "text", "userId",
        "viewsCount", "likesCount", "answersNum", "acceptedAnswerId", "isArchived", "createdAt"
      )
      VALUES (
        gen_random_uuid()::text, ${params.category}, 'ANSWER', ${params.questionId}, ${params.text}, ${params.userId},
        0, 0, 0, '', false, NOW()
      )
      RETURNING *
    `
  );
  const note = inserted[0];
  if (!note) return null;
  const users = await db.$queryRaw<UserRow[]>(
    Prisma.sql`SELECT id, wallet, username, "createdAt" FROM "User" WHERE id = ${note.userId}`
  );
  const user = users[0];
  if (!user) return null;
  return {
    ...note,
    user_username: user.username,
    user_wallet: user.wallet,
  };
}

/** Increment answersNum for a question. */
export async function incrementAnswersNum(questionId: string): Promise<void> {
  await db.$executeRaw(
    Prisma.sql`
      UPDATE "Note" SET "answersNum" = "answersNum" + 1 WHERE "id" = ${questionId} AND "type" = 'QUESTION'
    `
  );
}

/** Get board questions (no accepted answer), optionally by category. Order: newest first. */
export async function getBoardQuestions(
  categoryId: string | null
): Promise<NoteWithUser[]> {
  if (categoryId) {
    const rows = await db.$queryRaw<NoteWithUser[]>(
      Prisma.sql`
        SELECT n.*, u.username AS user_username, u.wallet AS user_wallet
        FROM "Note" n
        JOIN "User" u ON u.id = n."userId"
        WHERE n."type" = 'QUESTION' AND n."acceptedAnswerId" = '' AND n."category" = ${categoryId}
        ORDER BY n."createdAt" DESC
        LIMIT 100
      `
    );
    return rows;
  }
  const rows = await db.$queryRaw<NoteWithUser[]>(
    Prisma.sql`
      SELECT n.*, u.username AS user_username, u.wallet AS user_wallet
      FROM "Note" n
      JOIN "User" u ON u.id = n."userId"
      WHERE n."type" = 'QUESTION' AND n."acceptedAnswerId" = ''
      ORDER BY n."createdAt" DESC
      LIMIT 100
    `
  );
  return rows;
}

/** Get archive questions (have accepted answer), optionally by category. Order: likes DESC. */
export async function getArchiveQuestions(
  categoryId: string | null
): Promise<NoteWithUser[]> {
  if (categoryId) {
    const rows = await db.$queryRaw<NoteWithUser[]>(
      Prisma.sql`
        SELECT n.*, u.username AS user_username, u.wallet AS user_wallet
        FROM "Note" n
        JOIN "User" u ON u.id = n."userId"
        WHERE n."type" = 'QUESTION' AND n."acceptedAnswerId" != ''
        AND n."category" = ${categoryId}
        ORDER BY n."likesCount" DESC
        LIMIT 50
      `
    );
    return rows;
  }
  const rows = await db.$queryRaw<NoteWithUser[]>(
    Prisma.sql`
      SELECT n.*, u.username AS user_username, u.wallet AS user_wallet
      FROM "Note" n
      JOIN "User" u ON u.id = n."userId"
      WHERE n."type" = 'QUESTION' AND n."acceptedAnswerId" != ''
      ORDER BY n."likesCount" DESC
      LIMIT 50
    `
  );
  return rows;
}

/** Get a single question by id with user. Returns null if not found or not QUESTION. */
export async function getQuestionById(
  id: string
): Promise<NoteWithUser | null> {
  const rows = await db.$queryRaw<NoteWithUser[]>(
    Prisma.sql`
      SELECT n.*, u.username AS user_username, u.wallet AS user_wallet
      FROM "Note" n
      JOIN "User" u ON u.id = n."userId"
      WHERE n."id" = ${id} AND n."type" = 'QUESTION'
    `
  );
  return rows[0] ?? null;
}

/** Count how many answers a user has posted for a given question (max 3 allowed). */
export async function countUserAnswersForQuestion(
  questionId: string,
  userId: string
): Promise<number> {
  const rows = await db.$queryRaw<{ count: bigint }[]>(
    Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "Note"
      WHERE "type" = 'ANSWER' AND "referenceId" = ${questionId} AND "userId" = ${userId}
    `
  );
  return Number(rows[0]?.count ?? 0);
}

/** Get all ANSWER notes for a question, with user. */
export async function getAnswersForQuestion(
  questionId: string
): Promise<NoteWithUser[]> {
  const rows = await db.$queryRaw<NoteWithUser[]>(
    Prisma.sql`
      SELECT n.*, u.username AS user_username, u.wallet AS user_wallet
      FROM "Note" n
      JOIN "User" u ON u.id = n."userId"
      WHERE n."type" = 'ANSWER' AND n."referenceId" = ${questionId}
      ORDER BY n."createdAt" ASC
    `
  );
  return rows;
}

/** Get QUESTION notes by user id. Order: createdAt DESC. */
export async function getMyQuestions(userId: string): Promise<NoteWithUser[]> {
  const rows = await db.$queryRaw<NoteWithUser[]>(
    Prisma.sql`
      SELECT n.*, u.username AS user_username, u.wallet AS user_wallet
      FROM "Note" n
      JOIN "User" u ON u.id = n."userId"
      WHERE n."userId" = ${userId} AND n."type" = 'QUESTION'
      ORDER BY n."createdAt" DESC
    `
  );
  return rows;
}

/** Get ANSWER notes by user id (with question id/text/category for enrichment). */
export async function getMyAnswersWithQuestions(userId: string): Promise<
  (NoteWithUser & {
    question_id: string;
    question_text: string;
    question_category: string;
  })[]
> {
  const rows = await db.$queryRaw<
    (NoteWithUser & {
      question_id: string;
      question_text: string;
      question_category: string;
    })[]
  >(
    Prisma.sql`
      SELECT n.*, u.username AS user_username, u.wallet AS user_wallet,
             q.id AS question_id, q.text AS question_text, q.category AS question_category
      FROM "Note" n
      JOIN "User" u ON u.id = n."userId"
      LEFT JOIN "Note" q ON q.id = n."referenceId" AND q."type" = 'QUESTION'
      WHERE n."userId" = ${userId} AND n."type" = 'ANSWER'
      ORDER BY n."createdAt" DESC
    `
  );
  return rows;
}

/** Update question: set accepted answer. */
export async function acceptAnswer(
  questionId: string,
  answerId: string
): Promise<number> {
  const result = await db.$executeRaw(
    Prisma.sql`
      UPDATE "Note"
      SET "acceptedAnswerId" = ${answerId}
      WHERE "id" = ${questionId} AND "type" = 'QUESTION' AND "acceptedAnswerId" = ''
    `
  );
  return result;
}

/** Update question: set isArchived = true. */
export async function archiveQuestion(questionId: string): Promise<number> {
  const result = await db.$executeRaw(
    Prisma.sql`
      UPDATE "Note" SET "isArchived" = true
      WHERE "id" = ${questionId} AND "type" = 'QUESTION'
    `
  );
  return result;
}

/** Get a note by id (any type) with user wallet/username for ownership checks. */
export async function getNoteByIdWithUser(
  id: string
): Promise<
  (NoteRow & { user_wallet: string; user_username: string | null }) | null
> {
  const rows = await db.$queryRaw<
    (NoteRow & { user_wallet: string; user_username: string | null })[]
  >(
    Prisma.sql`
      SELECT n.*, u.wallet AS user_wallet, u.username AS user_username
      FROM "Note" n
      JOIN "User" u ON u.id = n."userId"
      WHERE n."id" = ${id}
    `
  );
  return rows[0] ?? null;
}

// ---------- Likes ----------

/** Increment likesCount for a question. Returns new likesCount or null if not found. */
export async function incrementLike(
  questionId: string
): Promise<{ likesCount: number } | null> {
  const updated = await db.$queryRaw<{ likesCount: number }[]>(
    Prisma.sql`
      UPDATE "Note"
      SET "likesCount" = "likesCount" + 1
      WHERE "id" = ${questionId} AND "type" = 'QUESTION'
      RETURNING "likesCount"
    `
  );
  const row = updated[0];
  return row ? { likesCount: Number(row.likesCount) } : null;
}

// ---------- Views (unique users) ----------

/**
 * Record a view by a unique user. Only counts each (question, user) once.
 * If userId is null (anonymous), does nothing and returns current viewsCount.
 * Returns new viewsCount or null if question not found.
 */
export async function recordUniqueView(
  questionId: string,
  userId: string | null
): Promise<{ viewsCount: number } | null> {
  const exists = await db.$queryRaw<{ id: string }[]>(
    Prisma.sql`SELECT "id" FROM "Note" WHERE "id" = ${questionId} AND "type" = 'QUESTION' LIMIT 1`
  );
  if (!exists[0]) return null;

  if (!userId) {
    const rows = await db.$queryRaw<{ viewsCount: number }[]>(
      Prisma.sql`SELECT "viewsCount" FROM "Note" WHERE "id" = ${questionId} LIMIT 1`
    );
    return rows[0] ? { viewsCount: Number(rows[0].viewsCount) } : null;
  }

  await db.$executeRaw(
    Prisma.sql`
      INSERT INTO "NoteView" ("id", "noteId", "userId", "createdAt")
      VALUES (gen_random_uuid()::text, ${questionId}, ${userId}, NOW())
      ON CONFLICT ("noteId", "userId") DO NOTHING
    `
  );
  const updated = await db.$queryRaw<{ viewsCount: number }[]>(
    Prisma.sql`
      UPDATE "Note"
      SET "viewsCount" = (SELECT COUNT(*)::int FROM "NoteView" WHERE "noteId" = ${questionId})
      WHERE "id" = ${questionId} AND "type" = 'QUESTION'
      RETURNING "viewsCount"
    `
  );
  const row = updated[0];
  return row ? { viewsCount: Number(row.viewsCount) } : null;
}

/** @deprecated Use recordUniqueView for unique-user counting. */
export async function incrementView(
  questionId: string
): Promise<{ viewsCount: number } | null> {
  const updated = await db.$queryRaw<{ viewsCount: number }[]>(
    Prisma.sql`
      UPDATE "Note"
      SET "viewsCount" = "viewsCount" + 1
      WHERE "id" = ${questionId} AND "type" = 'QUESTION'
      RETURNING "viewsCount"
    `
  );
  const row = updated[0];
  return row ? { viewsCount: Number(row.viewsCount) } : null;
}

/** Check if a note exists and is QUESTION (for like/view). */
export async function getQuestionLikesViews(
  questionId: string
): Promise<{ likesCount: number; viewsCount: number } | null> {
  const rows = await db.$queryRaw<{ likesCount: number; viewsCount: number }[]>(
    Prisma.sql`
      SELECT "likesCount", "viewsCount" FROM "Note"
      WHERE "id" = ${questionId} AND "type" = 'QUESTION'
    `
  );
  return rows[0] ?? null;
}

/** Get question count per category (for static categories API). */
export async function getQuestionCountByCategory(): Promise<
  Map<string, number>
> {
  const rows = await db.$queryRaw<{ category: string; count: bigint }[]>(
    Prisma.sql`
      SELECT "category", COUNT(*)::bigint AS count
      FROM "Note"
      WHERE "type" = 'QUESTION'
      GROUP BY "category"
    `
  );
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.category, Number(r.count));
  }
  return map;
}
