"use client";

import { useRouter } from "next/navigation";
import { NavArrowLeft } from "iconoir-react";

export function QuestionPageBack({ categoryId }: { categoryId: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() =>
        router.push(categoryId ? `/categories/${categoryId}` : "/categories")
      }
      className="touch-target flex items-center justify-center p-2 -ml-1 rounded-full hover:bg-gray-100 active:bg-gray-200"
      aria-label="Back"
    >
      <NavArrowLeft className="w-6 h-6 text-gray-700" />
    </button>
  );
}
