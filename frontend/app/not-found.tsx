import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F7F3] text-[#1B1D1A] p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-4 p-8 rounded-xl bg-white border border-[#D9DCD5] shadow-xs">
        <div className="sf-kpi text-6xl text-[#E7B900]">
          404
        </div>
        <h1 className="text-xl font-bold text-[#1B1D1A]">
          Page Not Found
        </h1>
        <p className="text-xs text-[#555B55] leading-relaxed">
          The requested edge monitoring route or camera stream does not exist or has been relocated.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#E7B900] hover:bg-[#D4A800] text-[#111310] font-semibold text-xs transition-colors shadow-xs"
          >
            Return to Live Cameras
          </Link>
        </div>
      </div>
    </div>
  );
}
