import { auth } from '@/auth';
import { AppShell } from '@/components/AppShell';
import { MyActivity } from '@/components/MyActivity';

/**
 * My Activity page - Shows user's questions and answers
 */
export default async function MyPage() {
  const session = await auth();

  return (
    <AppShell
      showBottomNav={true}
      showTopHeader={true}
      showBackButton={false}
      title="My Activity"
      headerActions={
        session?.user?.username && (
          <p className="text-sm font-semibold capitalize text-gray-700">
            {session.user.username}
          </p>
        )
      }
    >
      <div className="p-4">
        <MyActivity wallet={session?.user?.walletAddress || ''} />
      </div>
    </AppShell>
  );
}
