"use client";

import { Page } from "@/components/PageLayout";
import { TopBar, Button } from "@worldcoin/mini-apps-ui-kit-react";
import { useRouter } from "next/navigation";

/**
 * Home hub – first screen after login.
 * Share anonymously. Real people only. Likes, posts, and stats.
 */
export default function HomePage() {
  const router = useRouter();

  return (
    <>
      <Page.Header className="p-0">
        <TopBar title="Thought" />
      </Page.Header>
      <Page.Main className="flex flex-col">
        {/* Hero – soft tint so it’s not plain white */}
        <section className="glass mb-8 p-5 rounded-3xl bg-indigo-50/50 border-indigo-100/60 border-l-violet-200/40">
          <h1 className="text-xl font-semibold text-foreground tracking-tight mb-1">
            Share anonymously.
          </h1>
          <p className="text-indigo-700/90 text-sm mb-1 font-medium">
            Real people only.
          </p>
          <p className="text-gray-600 text-sm">Likes, posts, and stats.</p>
        </section>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => router.push("/categories")}
          >
            Browse categories
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => router.push("/home/create")}
          >
            Ask a question
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => router.push("/home/answer")}
          >
            Answer a question
          </Button>
        </div>
      </Page.Main>
    </>
  );
}
