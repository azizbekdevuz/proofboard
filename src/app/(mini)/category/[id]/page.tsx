'use client';

import { use, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
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
  const [categoryName, setCategoryName] = useState('Category');

  // Fetch category name for header
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        const category = categories.find((c: any) => c.id === id);
        if (category) {
          setCategoryName(category.name);
        }
      } catch (error) {
        console.error('Failed to fetch category:', error);
      }
    };
    fetchCategory();
  }, [id]);

  return (
    <AppShell
      showBottomNav={true}
      showTopHeader={true}
      showBackButton={true}
      title={categoryName}
    >
      <div className="p-4">
        <CategoryBoard categoryId={id} />
      </div>
    </AppShell>
  );
}
