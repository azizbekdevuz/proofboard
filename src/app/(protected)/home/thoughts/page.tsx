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
        {/* Read-Only Banner (if not authenticated) */}
        {!session && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-900 text-center">
              <span className="font-semibold">Demo Mode:</span> You're browsing read-only. Open in World App to post questions and answers.
            </p>
          </div>
        )}

        {/* How it Works - Quick Onboarding */}
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl">
          <h3 className="text-sm font-bold text-gray-900 mb-3">How it works</h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <p className="text-xs text-gray-700">Choose a category below</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <p className="text-xs text-gray-700">Post a question (requires World ID verification)</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <p className="text-xs text-gray-700">Accept the best answer to help others</p>
            </div>
          </div>
        </div>

        <CategoriesList />
      </div>
    </AppShell>
  );
}
