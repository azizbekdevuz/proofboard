'use client';

import Link from 'next/link';

export function ExploreHeaderActions({
  username,
}: {
  username?: string | null;
}) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/home/create"
        className="text-sm font-semibold text-blue-600 hover:underline"
      >
        Create
      </Link>
      {username && (
        <p className="text-sm font-semibold capitalize text-gray-700">
          {username}
        </p>
      )}
    </div>
  );
}
