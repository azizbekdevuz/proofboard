"use client";

import { Page } from "@/components/PageLayout";
import { useRouter } from "next/navigation";
import { NavArrowLeft, User } from "iconoir-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const PLATFORM_NAME = "Thought";

export type AppHeaderProps = {
  /** When set, show back button that navigates to this path. */
  backHref?: string;
  /** When set, show back button that calls this (e.g. custom back to category). */
  onBack?: () => void;
  /** Optional title shown next to back or in the center when no back. */
  title?: string;
  className?: string;
};

/**
 * App header: left = back icon or platform name, right = profile.
 */
export function AppHeader({ backHref, onBack, title, className }: AppHeaderProps) {
  const router = useRouter();
  const showBack = Boolean(backHref ?? onBack);

  const handleBack = () => {
    if (onBack) onBack();
    else if (backHref) router.push(backHref);
  };

  return (
    <Page.Header
      className={twMerge(
        "p-0 border-b-0 bg-transparent backdrop-blur-none border-none shadow-none [background:none] [box-shadow:none] [-webkit-backdrop-filter:none] [backdrop-filter:none]",
        clsx(className),
      )}
    >
      <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-3 min-h-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              className="touch-target flex items-center justify-center w-9 h-9 rounded-full bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] transition-[border-color,background] duration-300 shrink-0"
              aria-label="Back"
            >
              <NavArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          ) : (
            <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              {PLATFORM_NAME}
            </h1>
          )}
          {title != null && title !== "" && (
            <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)] truncate">
              {title}
            </h1>
          )}
        </div>
        <button
          type="button"
          onClick={() => router.push("/home/my")}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--surface-2)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] transition-[border-color,background] duration-300 shrink-0"
          aria-label="Profile"
        >
          <User className="w-4 h-4 text-[var(--text-secondary)]" />
        </button>
      </div>
    </Page.Header>
  );
}
