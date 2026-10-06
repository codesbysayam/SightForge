'use client';

import React, { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
      <h2 className="text-xl font-bold text-[#1B1D1A] mb-2">Something went wrong</h2>
      <p className="text-xs text-[#555B55] mb-4">An error occurred while loading this view.</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 rounded-lg bg-[#E7B900] hover:bg-[#D4A800] text-[#111310] font-semibold text-xs transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
