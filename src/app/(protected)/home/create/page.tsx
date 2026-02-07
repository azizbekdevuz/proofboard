import { Page } from "@/components/PageLayout";
import { AppHeader } from "@/components/AppHeader";
import { NewPostForm } from "@/components/NewPostForm";

/**
 * New Post screen – dark premium form.
 */
export default function CreatePostPage() {
  return (
    <>
      <AppHeader backHref="/home" title="Ask a question" />
      <Page.Main>
        <NewPostForm />
      </Page.Main>
    </>
  );
}
