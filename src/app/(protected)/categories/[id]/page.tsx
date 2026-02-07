import { Page } from "@/components/PageLayout";
import { AppHeader } from "@/components/AppHeader";
import { CategoryGrid } from "@/components/CategoryGrid";
import { notFound } from "next/navigation";
import { getCategoryById } from "@/lib/categories";

/**
 * Category view – dark premium design.
 */
export default async function CategoryByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = getCategoryById(id);
  if (!category) notFound();

  return (
    <>
      <AppHeader backHref="/categories" title={category.name} />
      <Page.Main className="min-h-0">
        <CategoryGrid categoryId={id} />
      </Page.Main>
    </>
  );
}
