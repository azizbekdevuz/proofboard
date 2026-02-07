'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  showBottomNav?: boolean;
  showTopHeader?: boolean;
  showBackButton?: boolean;
  title?: string;
  headerActions?: ReactNode;
}

/**
 * AppShell - Persistent navigation wrapper for ProofBoard
 * 
 * Features:
 * - Optional top header with back button
 * - Main content area with safe-area padding
 * - Optional bottom navigation bar
 * - Mobile-first, touch-friendly design
 */
export function AppShell({
  children,
  showBottomNav = true,
  showTopHeader = false,
  showBackButton = false,
  title,
  headerActions,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleBack = () => {
    // Try to go back in history
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to home if no history
      router.push('/home/thoughts');
    }
  };

  const handleHome = () => {
    router.push('/home/thoughts');
  };

  const handleMy = () => {
    router.push('/home/my');
  };

  // Determine active tab
  const isHomeActive = pathname?.startsWith('/home/thoughts') || pathname === '/home';
  const isMyActive = pathname?.startsWith('/home/my');

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Header (Optional) */}
      {showTopHeader && (
        <header 
          className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center justify-between h-16 px-5">
            {/* Left: Back Button */}
            <div className="flex items-center gap-2 min-w-[44px]">
              {showBackButton && (
                <button
                  onClick={handleBack}
                  className="flex items-center justify-center w-11 h-11 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all active:scale-95"
                  aria-label="Go back"
                >
                  <svg
                    className="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Center: Title */}
            <div className="flex-1 text-center px-4">
              <h1 className="text-lg font-bold text-gray-900 truncate tracking-tight">
                {title || 'ProofBoard'}
              </h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 min-w-[44px] justify-end">
              {headerActions}
              {showBackButton && (
                <button
                  onClick={handleHome}
                  className="flex items-center justify-center w-11 h-11 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all active:scale-95"
                  aria-label="Go to home"
                >
                  <svg
                    className="w-5 h-5 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main 
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: showBottomNav 
            ? 'calc(64px + env(safe-area-inset-bottom))' 
            : 'env(safe-area-inset-bottom)',
        }}
      >
        {children}
      </main>

      {/* Bottom Navigation (Optional) */}
      {showBottomNav && (
        <nav 
          className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
          }}
        >
          <div className="flex items-center justify-around h-20 px-4">
            {/* Home Tab */}
            <button
              onClick={handleHome}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${
                isHomeActive
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 active:scale-95'
              }`}
              aria-label="Home"
              aria-current={isHomeActive ? 'page' : undefined}
            >
              {isHomeActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-indigo-600 rounded-full" />
              )}
              <svg
                className="w-7 h-7 mb-1.5"
                fill={isHomeActive ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={isHomeActive ? 0 : 2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className={`text-xs ${isHomeActive ? 'font-semibold' : 'font-medium'}`}>Home</span>
            </button>

            {/* My Tab */}
            <button
              onClick={handleMy}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${
                isMyActive
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 active:scale-95'
              }`}
              aria-label="My Activity"
              aria-current={isMyActive ? 'page' : undefined}
            >
              {isMyActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-indigo-600 rounded-full" />
              )}
              <svg
                className="w-7 h-7 mb-1.5"
                fill={isMyActive ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={isMyActive ? 0 : 2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className={`text-xs ${isMyActive ? 'font-semibold' : 'font-medium'}`}>My</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
