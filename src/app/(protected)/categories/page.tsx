"use client";

import { Page } from "@/components/PageLayout";
import { TopBar, Button } from "@worldcoin/mini-apps-ui-kit-react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { CATEGORY_TILE_CLASSES, getCategoryIndex } from "@/lib/category-colors";
import { NavArrowLeft } from "iconoir-react";

/**
 * Categories – first page after login.
 * Level 1: Back button + "Categories" title
 * Level 2: 3 rows × 2 columns = 6 categories in full view
 * Level 3: Left "Question", Right "Answer" buttons
 */
export default function CategoriesPage() {
  const router = useRouter();

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="Categories"
          startAdornment={
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="touch-target flex items-center justify-center p-2 -ml-1 rounded-full hover:bg-gray-100 active:bg-gray-200"
              aria-label="Back"
            >
              <NavArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
          }
        />
      </Page.Header>
      <Page.Main className="flex flex-col">
        {/* Level 2: 3 rows × 2 columns = 6 categories */}
        <div className="grid grid-cols-2 gap-3 flex-1 content-start">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => router.push(`/categories/${cat.id}`)}
              className={`aspect-square rounded-2xl border ${
                CATEGORY_TILE_CLASSES[getCategoryIndex(cat.id)]
              } backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] active:scale-[0.98] transition flex items-center justify-center p-4 text-center`}
            >
              <span className="font-semibold text-sm sm:text-base">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
        {/* Level 3: Question (left) | Answer (right) */}
        <div className="grid grid-cols-2 gap-3 pt-4 pb-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => router.push("/home/create")}
          >
            Question
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => router.push("/home/answer")}
          >
            Answer
          </Button>
        </div>
      </Page.Main>
    </>
  );
}
