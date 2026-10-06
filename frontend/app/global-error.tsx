'use client';

import React from 'react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#F7F7F3] text-[#1B1D1A] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-xl bg-white border border-[#D9DCD5]">
          <h2 className="text-xl font-bold text-[#1B1D1A]">Application Error</h2>
          <p className="text-xs text-[#555B55]">A global error occurred.</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-lg bg-[#E7B900] hover:bg-[#D4A800] text-[#111310] font-semibold text-xs transition-colors"
          >
            Reset Application
          </button>
        </div>
      </body>
    </html>
  );
}
