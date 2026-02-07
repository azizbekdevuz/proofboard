import { auth } from "@/auth";
import { Page } from "@/components/PageLayout";
import { AppHeader } from "@/components/AppHeader";
import { MyActivity } from "@/components/MyActivity";
import Link from "next/link";

/**
 * Profile / My Activity – dark premium design.
 */
export default async function MyPage() {
  const session = await auth();

  return (
    <>
      <AppHeader />

      <Page.Main className="flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
            Profile
          </h2>
          {session?.user?.username && (
            <span className="text-sm font-medium text-[var(--accent-violet)] capitalize px-3 py-1 rounded-full bg-[var(--accent-violet-dim)] border border-[rgba(167,139,250,0.2)]">
              {session.user.username}
            </span>
          )}
        </div>
        <MyActivity wallet={session?.user?.walletAddress || ""} />
        <footer className="mt-8 pt-4 border-t border-[var(--border-subtle)]">
          <Link
            href="/privacy"
            className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Privacy & data
          </Link>
        </footer>
      </Page.Main>
    </>
  );
}
