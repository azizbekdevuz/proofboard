"use client";

import { Page } from "@/components/PageLayout";
import { AppHeader } from "@/components/AppHeader";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { CATEGORY_TILE_CLASSES, getCategoryIndex } from "@/lib/category-colors";
import { MessageText, ChatBubble } from "iconoir-react";

const CATEGORY_EMOJIS = ["💕", "👨‍👩‍👧‍👦", "🧘", "₿", "💼", "✨"];

/**
 * Categories – immersive dark grid with glowing tiles.
 */
export default function CategoriesPage() {
  const router = useRouter();

  return (
    <>
      <AppHeader backHref="/home" title="Categories" />

      <Page.Main className="flex flex-col gap-5">
        {/* Category grid */}
        <div className="grid grid-cols-2 gap-3 stagger-children">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => router.push(`/categories/${cat.id}`)}
              className={`relative aspect-square rounded-[var(--card-radius)] ${
                CATEGORY_TILE_CLASSES[getCategoryIndex(cat.id)]
              } backdrop-blur-xl active:scale-[0.97] transition-[transform,background,border-color] duration-300 flex flex-col items-center justify-center p-6 text-center gap-2 overflow-hidden`}
            >
              <span
                className="text-3xl animate-float"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                {CATEGORY_EMOJIS[i]}
              </span>
              <span className="font-semibold text-sm tracking-tight">
                {cat.name}
              </span>
            </button>
          ))}
        </div>

        {/* Action row */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push("/home/create")}
            className="btn-accent flex items-center justify-center gap-2 py-4 text-sm"
          >
            <MessageText className="w-4 h-4" />
            Question
          </button>
          <button
            type="button"
            onClick={() => router.push("/home/answer")}
            className="btn-ghost flex items-center justify-center gap-2 py-4 text-sm"
          >
            <ChatBubble className="w-4 h-4 text-[var(--accent-emerald)]" />
            Answer
          </button>
        </div>
      </Page.Main>
    </>
  );
}
