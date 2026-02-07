"use client";

import { useRouter } from "next/navigation";
import { NavArrowLeft } from "iconoir-react";

export function CategoriesIdBack() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push("/categories")}
      className="touch-target flex items-center justify-center w-9 h-9 rounded-full bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] transition"
      aria-label="Back to categories"
    >
      <NavArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
    </button>
  );
}
