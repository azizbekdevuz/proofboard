import { Page } from "@/components/PageLayout";
import { AuthSection } from "@/components/AuthSection";

export default function Home() {
  return (
    <Page>
      <Page.Main className="flex flex-col items-center justify-center gap-8">
        <div className="text-center space-y-3 animate-fade-in-up">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Thought
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Anonymous Q&A for real humans
          </p>
        </div>
        <AuthSection />
      </Page.Main>
    </Page>
  );
}
