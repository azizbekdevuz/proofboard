'use client';

import { TabItem, Tabs } from '@worldcoin/mini-apps-ui-kit-react';
import { Home, User } from 'iconoir-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Navigation component for ProofBoard
 * Uses World Mini App UI Kit Tabs component
 * Read More: https://docs.world.org/mini-apps/design/app-guidelines#mobile-first
 */
export const Navigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [value, setValue] = useState('thoughts');

  // Sync tab value with current pathname
  useEffect(() => {
    if (pathname === '/home' || pathname.startsWith('/home/thoughts')) {
      setValue('thoughts');
    } else if (pathname.startsWith('/home/my')) {
      setValue('my');
    }
  }, [pathname]);

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    if (newValue === 'thoughts') {
      router.push('/home/thoughts');
    } else if (newValue === 'my') {
      router.push('/home/my');
    }
  };

  return (
    <Tabs value={value} onValueChange={handleValueChange}>
      <TabItem value="thoughts" icon={<Home />} label="Thoughts" />
      <TabItem value="my" icon={<User />} label="My" />
    </Tabs>
  );
};
