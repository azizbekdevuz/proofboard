"use client";

import { Page } from "@/components/PageLayout";
import { AppHeader } from "@/components/AppHeader";
import { useRouter } from "next/navigation";
import { ChatBubble, MessageText, GridPlus, Sparks } from "iconoir-react";

/**
 * Home hub – dark, immersive landing. Premium feel.
 */
export default function HomePage() {
  const router = useRouter();

  return (
    <>
      <AppHeader />

      <Page.Main className="flex flex-col gap-6 pb-8">
        {/* Hero */}
        <section className="relative mt-4 animate-fade-in-up">
          <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-[var(--accent-violet)] opacity-[0.06] blur-[60px] pointer-events-none" />
          <div className="absolute -bottom-4 -right-8 w-32 h-32 rounded-full bg-[var(--accent-rose)] opacity-[0.05] blur-[50px] pointer-events-none" />

          <div className="relative glass-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparks className="w-5 h-5 text-[var(--accent-violet)]" />
              <span className="text-xs font-medium tracking-widest uppercase text-[var(--accent-violet)]">
                Anonymous Q&A
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
              Share your thoughts.
              <br />
              <span className="gradient-text">Stay anonymous.</span>
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Real people only. Verified with World ID. Your likes, posts, and
              stats — all in one place.
            </p>
          </div>
        </section>

        {/* CTAs */}
        <div className="flex flex-col gap-3 stagger-children">
          <button
            type="button"
            onClick={() => router.push("/categories")}
            className="btn-accent flex items-center justify-center gap-3 w-full py-5 px-6 text-[15px]"
          >
            <GridPlus className="w-5 h-5" />
            Browse categories
          </button>

          <button
            type="button"
            onClick={() => router.push("/home/create")}
            className="btn-ghost flex items-center justify-center gap-3 w-full py-5 px-6 text-[15px]"
          >
            <MessageText className="w-5 h-5 text-[var(--accent-violet)]" />
            Ask a question
          </button>

          <button
            type="button"
            onClick={() => router.push("/home/answer")}
            className="btn-ghost flex items-center justify-center gap-3 w-full py-5 px-6 text-[15px]"
          >
            <ChatBubble className="w-5 h-5 text-[var(--accent-emerald)]" />
            Answer a question
          </button>
        </div>

        {/* Stats teaser */}
        <div
          className="grid grid-cols-3 gap-3 mt-2 animate-fade-in-up"
          style={{ animationDelay: "400ms" }}
        >
          {[
            { label: "Anonymous", icon: "🔒" },
            { label: "Verified", icon: "✓" },
            { label: "Real people", icon: "🌍" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]"
            >
              <span className="text-lg">{stat.icon}</span>
              <span className="text-[11px] font-medium text-[var(--text-tertiary)] tracking-wide">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </Page.Main>
    </>
  );
}
