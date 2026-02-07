import clsx from 'clsx';
import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

/**
 * Page layout – dark, edge-to-edge, immersive.
 */
export const Page = (props: { children: ReactNode; className?: string }) => {
  return (
    <div
      className={twMerge(clsx('flex h-dvh flex-col main-tint', props.className))}
    >
      {props.children}
    </div>
  );
};

const Header = (props: { children: ReactNode; className?: string }) => {
  return (
    <header
      className={twMerge(
        'glass flex flex-col justify-center px-6 pt-6 pb-5 z-10',
        clsx(props.className),
      )}
    >
      {props.children}
    </header>
  );
};

const Main = (props: { children: ReactNode; className?: string }) => {
  return (
    <main
      className={twMerge(
        clsx('grow overflow-y-auto p-6 main-tint', props.className),
      )}
    >
      {props.children}
    </main>
  );
};

Page.Header = Header;
Page.Main = Main;
