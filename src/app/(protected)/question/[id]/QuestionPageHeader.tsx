"use client";

import { AppHeader } from "@/components/AppHeader";
import { useRouter } from "next/navigation";

export function QuestionPageHeader({
  categoryId,
  title,
}: {
  categoryId: string;
  title: string;
}) {
  const router = useRouter();
  return (
    <AppHeader
      onBack={() =>
        router.push(categoryId ? `/categories/${categoryId}` : "/categories")
      }
      title={title || "Thought"}
    />
  );
}
