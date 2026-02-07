/**
 * App-wide enums and enum-like constants.
 */

export const NoteType = {
  QUESTION: "QUESTION",
  ANSWER: "ANSWER",
} as const;

export type NoteType = (typeof NoteType)[keyof typeof NoteType];
