import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import { MyActivity } from '@/components/MyActivity';
import Link from 'next/link';

/**
 * My Activity page - Shows user's questions and answers
 */
export default async function MyPage() {
  const session = await auth();

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="Profile"
          endAdornment={
            session?.user?.username && (
              <p className="text-sm font-semibold capitalize">
                {session.user.username}
              </p>
            )
          }
        />
      </Page.Header>
      <Page.Main className="flex flex-col">
        <MyActivity wallet={session?.user?.walletAddress || ''} />
        <footer className="mt-8 pt-4 border-t border-gray-200">
          <Link
            href="/privacy"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Privacy & data
          </Link>
        </footer>
      </Page.Main>
    </>
  );
}
