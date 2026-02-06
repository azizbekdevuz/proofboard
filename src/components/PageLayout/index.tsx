import clsx from 'clsx';
import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

/**
 * This component is a simple page layout component to help with design consistency
 * Feel free to modify this component to fit your needs
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

/** Default padding: 24px for consistent breathing room and clean structure */
const PADDING_DEFAULT = 'p-6'; // 24px

const Header = (props: { children: ReactNode; className?: string }) => {
  return (
    <header
      className={twMerge(
        'glass flex flex-col justify-center px-6 pt-6 pb-6 z-10',
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
        clsx(`grow overflow-y-auto ${PADDING_DEFAULT} main-tint`, props.className),
      )}
    >
      {props.children}
    </main>
  );
};

const Footer = (props: { children: ReactNode; className?: string }) => {
  return (
    <footer className={twMerge('px-6 pb-[35px] pt-0', clsx(props.className))}>
      {props.children}
    </footer>
  );
};

Page.Header = Header;
Page.Main = Main;
Page.Footer = Footer;
