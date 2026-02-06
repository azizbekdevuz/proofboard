import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import { MyActivity } from '@/components/MyActivity';

/**
 * My Activity page - Shows user's questions and answers
 */
export default async function MyPage() {
  const session = await auth();

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="My Activity"
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
        <MyActivity wallet={session?.user?.walletAddress || ''} />
      </Page.Main>
    </>
  );
}
