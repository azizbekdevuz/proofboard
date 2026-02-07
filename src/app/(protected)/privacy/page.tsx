import { Page } from '@/components/PageLayout';
import { AppHeader } from '@/components/AppHeader';
import Link from 'next/link';

/**
 * Privacy and data use—for App Review (consent & data minimization).
 */
export default function PrivacyPage() {
  return (
    <>
      <AppHeader backHref="/home/my" title="Privacy" />
      <Page.Main className="max-w-lg">
        <div className="prose prose-sm text-gray-700 space-y-4">
          <p>
            Thought uses World App to verify that you are a unique human. By
            signing in, you allow us to use your wallet address to link your
            account and to store the posts and comments you create.
          </p>
          <p>
            We only collect what is needed to run the app: your wallet (from
            World App), an optional username if you set one, and the content you
            post. We do not sell your data.
          </p>
          <p>
            If you have questions, contact the developer through the World
            Developer Portal.
          </p>
        </div>
        <p className="mt-6">
          <Link
            href="/home/my"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Back to Profile
          </Link>
        </p>
      </Page.Main>
    </>
  );
}
