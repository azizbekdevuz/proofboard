'use client';

import { Page } from '@/components/PageLayout';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import { use } from 'react';
import { CategoryBoard } from '@/components/CategoryBoard';

/**
 * Category board page - Shows questions as sticky notes
 * Users can view questions, post new ones, and answer existing ones
 */
export default function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <>
      <Page.Header className="p-0">
        <TopBar title="Category Board" />
      </Page.Header>
      <Page.Main className="p-4">
        <CategoryBoard categoryId={id} />
      </Page.Main>
    </>
  );
}
