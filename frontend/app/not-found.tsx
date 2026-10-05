import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white p-4">
      <h2 className="text-2xl font-bold font-sans">404 - Page Not Found</h2>
      <p className="text-slate-400 mt-2 font-sans text-sm">The requested resource could not be found.</p>
      <Link href="/" className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-sans text-sm transition-all">
        Return Home
      </Link>
    </div>
  );
}
