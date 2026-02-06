import { auth } from '@/auth';
import { SafeAreaLayout } from '@/components/SafeAreaLayout';
import { redirect } from 'next/navigation';

export default async function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/');
  }

  return <SafeAreaLayout>{children}</SafeAreaLayout>;
}
