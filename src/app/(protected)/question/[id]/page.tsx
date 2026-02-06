import { Page } from "@/components/PageLayout";
import { TopBar } from "@worldcoin/mini-apps-ui-kit-react";
import { QuestionCanvas } from "@/components/QuestionCanvas";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  getNoteById,
  getAnswersForQuestion,
  isFakeDataEnabled,
} from "@/lib/fake-data";
import { getCategoryName } from "@/lib/categories";
import { getCategoryGradientClasses } from "@/lib/category-colors";
import { QuestionPageBack } from "./back";

/**
 * Question detail – canvas-style layout with question card, answer cards, category link
 */
export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let note: {
    id: string;
    text: string;
    category: string;
    type: "QUESTION" | "ANSWER";
    referenceId: string;
    viewsCount: number;
    likesCount: number;
    answersNum: number;
    acceptedAnswerId: string;
    isArchived: boolean;
    createdAt: string | Date;
    user: { username: string | null; wallet: string };
    answers: Array<{
      id: string;
      text: string;
      createdAt: string | Date;
      viewsCount: number;
      likesCount: number;
      acceptedAnswerId: string;
      user: { username: string | null; wallet: string };
    }>;
  } | null = null;

  if (isFakeDataEnabled()) {
    const fakeNote = getNoteById(id);
    if (fakeNote && fakeNote.type === "QUESTION") {
      const answers = getAnswersForQuestion(id);
      note = { ...fakeNote, answers };
    }
  } else {
    const dbNote = await db.note.findUnique({
      where: { id },
      include: {
        user: { select: { username: true, wallet: true } },
      },
    });
    if (dbNote && dbNote.type === "QUESTION") {
      const dbAnswers = await db.note.findMany({
        where: { type: "ANSWER", referenceId: id },
        include: {
          user: { select: { username: true, wallet: true } },
        },
        orderBy: { createdAt: "asc" },
      });
      note = { ...dbNote, answers: dbAnswers };
    }
  }

  if (!note) notFound();

  const serialized = {
    ...note,
    categoryName: getCategoryName(note.category),
    createdAt:
      typeof note.createdAt === "string"
        ? note.createdAt
        : note.createdAt.toISOString(),
    answers: note.answers.map((a) => ({
      ...a,
      createdAt:
        typeof a.createdAt === "string"
          ? a.createdAt
          : a.createdAt.toISOString(),
    })),
  };

  const title =
    serialized.text.slice(0, 30) + (serialized.text.length > 30 ? "…" : "");

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title={title || "Thought"}
          startAdornment={<QuestionPageBack categoryId={serialized.category} />}
        />
      </Page.Header>
      <Page.Main
        className={`p-6 flex flex-col min-h-0 ${getCategoryGradientClasses(serialized.category)}`}
      >
        <QuestionCanvas question={serialized} />
      </Page.Main>
    </>
  );
}
