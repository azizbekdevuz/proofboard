import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import { CategoriesList } from '@/components/CategoriesList';

/**
 * Thoughts page - Shows list of categories
 * Users can browse categories and view questions
 */
export default async function ThoughtsPage() {
  const session = await auth();

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="Thoughts"
          endAdornment={
            session?.user?.username && (
              <p className="text-sm font-semibold capitalize">
                {session.user.username}
              </p>
            )
          }
        />
      </Page.Header>
      <Page.Main className="p-4">
        <CategoriesList />
      </Page.Main>
    </>
  );
}
