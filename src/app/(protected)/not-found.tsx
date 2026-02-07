import Link from "next/link";
import { Page } from "@/components/PageLayout";
import { AppHeader } from "@/components/AppHeader";

/**
 * Shown when a question or category doesn't exist (e.g. deleted, wrong id, or
 * with fake data after server restart). Keeps the same chrome as the app.
 */
export default function NotFound() {
  return (
    <>
      <AppHeader backHref="/home" title="Thought" />
      <Page.Main className="p-6 flex flex-col items-center justify-center gap-6 text-center min-h-0">
        <p className="text-[var(--text-secondary)]">
          This page doesn&apos;t exist or was removed.
        </p>
        <Link
          href="/home"
          className="btn-accent py-3 px-6 text-[15px] rounded-[14px]"
        >
          Back to Home
        </Link>
      </Page.Main>
    </>
  );
}
