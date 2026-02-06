/**
 * Category color class names. All actual colors live in CSS (globals.css).
 * 6 categories × 4 card variants (question/answer × read/unread).
 */

import { CATEGORIES } from "@/lib/categories";

/** Category order index 0–5 for consistent mapping */
const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

/** Card variant class names: cat-card + cat-card-{0..5}-{q|a}-{read|unread} */
const CARD_VARIANT_CLASSES: {
  questionRead: string;
  questionUnread: string;
  answerRead: string;
  answerUnread: string;
}[] = [
  { questionRead: "cat-card-0-q-read", questionUnread: "cat-card-0-q-unread", answerRead: "cat-card-0-a-read", answerUnread: "cat-card-0-a-unread" },
  { questionRead: "cat-card-1-q-read", questionUnread: "cat-card-1-q-unread", answerRead: "cat-card-1-a-read", answerUnread: "cat-card-1-a-unread" },
  { questionRead: "cat-card-2-q-read", questionUnread: "cat-card-2-q-unread", answerRead: "cat-card-2-a-read", answerUnread: "cat-card-2-a-unread" },
  { questionRead: "cat-card-3-q-read", questionUnread: "cat-card-3-q-unread", answerRead: "cat-card-3-a-read", answerUnread: "cat-card-3-a-unread" },
  { questionRead: "cat-card-4-q-read", questionUnread: "cat-card-4-q-unread", answerRead: "cat-card-4-a-read", answerUnread: "cat-card-4-a-unread" },
  { questionRead: "cat-card-5-q-read", questionUnread: "cat-card-5-q-unread", answerRead: "cat-card-5-a-read", answerUnread: "cat-card-5-a-unread" },
];

/** Tile class names for Categories page (cat-tile-0 .. cat-tile-5) */
export const CATEGORY_TILE_CLASSES = ["cat-tile-0", "cat-tile-1", "cat-tile-2", "cat-tile-3", "cat-tile-4", "cat-tile-5"];

/** Pill class names for horizontal filters */
export const CATEGORY_PILL_CLASSES = ["cat-pill-0", "cat-pill-1", "cat-pill-2", "cat-pill-3", "cat-pill-4", "cat-pill-5"];

/** Meta text class names */
const CATEGORY_META_CLASSES = ["cat-meta-0", "cat-meta-1", "cat-meta-2", "cat-meta-3", "cat-meta-4", "cat-meta-5"];

/** Link class names */
const CATEGORY_LINK_CLASSES = ["cat-link-0", "cat-link-1", "cat-link-2", "cat-link-3", "cat-link-4", "cat-link-5"];

/** Gradient class names for question detail page (use with cat-gradient-bg) */
export const CATEGORY_GRADIENT_CLASSES = ["cat-gradient-0", "cat-gradient-1", "cat-gradient-2", "cat-gradient-3", "cat-gradient-4", "cat-gradient-5"];

export function getCategoryIndex(categoryId: string): number {
  const i = CATEGORY_IDS.indexOf(categoryId);
  return i >= 0 ? i : 0;
}

export function getCategoryMetaClasses(categoryId: string): string {
  return CATEGORY_META_CLASSES[getCategoryIndex(categoryId)];
}

export function getCategoryLinkClasses(categoryId: string): string {
  return `font-medium ${CATEGORY_LINK_CLASSES[getCategoryIndex(categoryId)]}`;
}

export function getCategoryGradientClasses(categoryId: string): string {
  return `cat-gradient-bg ${CATEGORY_GRADIENT_CLASSES[getCategoryIndex(categoryId)]}`;
}

const CARD_BASE = "cat-card rounded-2xl";

export function getCategoryCardClasses(
  categoryId: string,
  isUnread: boolean,
  type: "question" | "answer"
): string {
  const v = CARD_VARIANT_CLASSES[getCategoryIndex(categoryId)];
  const tint =
    type === "question"
      ? isUnread ? v.questionUnread : v.questionRead
      : isUnread ? v.answerUnread : v.answerRead;
  return `${CARD_BASE} ${tint}`;
}

export function isQuestionUnread(viewsCount: number): boolean {
  return viewsCount <= 1;
}

export function isAnswerUnread(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return created >= dayAgo;
}
