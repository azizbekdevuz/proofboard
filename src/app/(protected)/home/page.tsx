import { redirect } from 'next/navigation';

/**
 * Home page redirects to Thoughts tab
 * This is the default landing page after authentication
 */
export default function Home() {
  redirect('/home/thoughts');
}
