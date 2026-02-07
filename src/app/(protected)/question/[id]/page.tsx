import { Page } from "@/components/PageLayout";
import { QuestionCanvas } from "@/components/QuestionCanvas";
import { QuestionPageHeader } from "./QuestionPageHeader";
import { notFound } from "next/navigation";
import {
  getNoteById,
  getAnswersForQuestion,
  isFakeDataEnabled,
} from "@/lib/fake-data";
import {
  getQuestionById,
  getAnswersForQuestion as getAnswersForQuestionSql,
  incrementView,
  toNoteApiResponse,
} from "@/lib/notes-sql";
import { getCategoryName } from "@/lib/categories";
import { getCategoryGradientClasses } from "@/lib/category-colors";

/**
 * Question detail – immersive dark canvas.
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
    const dbNote = await getQuestionById(id);
    if (dbNote) {
      await incrementView(id);
      const dbAnswers = await getAnswersForQuestionSql(id);
      note = {
        ...toNoteApiResponse(dbNote),
        answers: dbAnswers.map(toNoteApiResponse),
      };
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
      <QuestionPageHeader
        categoryId={serialized.category}
        title={title}
      />
      <Page.Main
        className={`p-6 flex flex-col min-h-0 ${getCategoryGradientClasses(serialized.category)}`}
      >
        <QuestionCanvas question={serialized} />
      </Page.Main>
    </>
  );
}
