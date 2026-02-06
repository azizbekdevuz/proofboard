import { Page } from '@/components/PageLayout';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import { NewPostForm } from '@/components/NewPostForm';
import { CreatePageBack } from './back';

/**
 * New Post screen - Text, category selection, Post (Figma Screen F/H/I)
 */
export default function CreatePostPage() {
  return (
    <>
      <Page.Header className="p-0">
        <TopBar title="Ask a question" startAdornment={<CreatePageBack />} />
      </Page.Header>
      <Page.Main>
        <NewPostForm />
      </Page.Main>
    </>
  );
}
