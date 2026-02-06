/**
 * Fixed list of categories – stored in code, NOT in the database.
 * Order matters: Dating/Romance, Family, Self, Crypto, Business, Other.
 */

import type { Category } from "@/libs/types";

export type { Category };
export const CATEGORIES: Category[] = [
  { id: "cat-dating", name: "Dating/Romance" },
  { id: "cat-family", name: "Family" },
  { id: "cat-self", name: "Self" },
  { id: "cat-crypto", name: "Crypto" },
  { id: "cat-business", name: "Business" },
  { id: "cat-other", name: "Other" },
];

/** Look up a category by id; returns undefined when not found. */
export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

/** Get the name for a category id, falling back to "Uncategorized". */
export function getCategoryName(id: string): string {
  return getCategoryById(id)?.name ?? "Uncategorized";
}
