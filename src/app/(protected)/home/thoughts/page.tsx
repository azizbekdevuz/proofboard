import { auth } from '@/auth';
import { AppShell } from '@/components/AppShell';
import { CategoriesList } from '@/components/CategoriesList';

/**
 * Thoughts page - Shows list of categories
 * Users can browse categories and view questions
 */
export default async function ThoughtsPage() {
  const session = await auth();

  return (
    <AppShell
      showBottomNav={true}
      showTopHeader={true}
      showBackButton={false}
      title="Thoughts"
      headerActions={
        session?.user?.username && (
          <p className="text-sm font-semibold capitalize text-gray-700">
            {session.user.username}
          </p>
        )
      }
    >
      <div className="p-4">
        <CategoriesList />
      </div>
    </AppShell>
  );
}
