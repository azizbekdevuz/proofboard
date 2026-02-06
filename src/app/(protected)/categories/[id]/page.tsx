import { Page } from "@/components/PageLayout";
import { TopBar } from "@worldcoin/mini-apps-ui-kit-react";
import { CategoryGrid } from "@/components/CategoryGrid";
import { notFound } from "next/navigation";
import { getCategoryById } from "@/lib/categories";
import { CategoriesIdBack } from "./back";

/**
 * Category view – questions in this category
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
      <Page.Header className="p-0">
        <TopBar title={category.name} startAdornment={<CategoriesIdBack />} />
      </Page.Header>
      <Page.Main className="min-h-0">
        <CategoryGrid categoryId={id} />
      </Page.Main>
    </>
  );
}
