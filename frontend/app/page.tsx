"use client";

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically load CameraStream with SSR disabled to prevent browser-only library APIs (recharts/motion) from throwing errors during Next.js static prerendering
const CameraStream = dynamic(() => import('../components/CameraStream'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-blue-500/10 border-t-4 border-t-blue-500 animate-spin"></div>
        <div className="absolute w-10 h-10 rounded-full border-4 border-cyan-500/10 border-b-4 border-b-cyan-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      <p className="text-slate-400 font-mono text-xs tracking-wider uppercase mt-6 animate-pulse">INITIATING VISIONTRACK AI FRAMEWORK...</p>
    </div>
  )
});

export default function App() {
  return (
    <div className="min-h-screen select-none antialiased">
      <CameraStream />
    </div>
  );
}

