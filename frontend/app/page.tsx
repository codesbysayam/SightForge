"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { BRAND } from '../config/brand';
import SightForgeLogo from '../components/brand/SightForgeLogo';

const AppLayout = dynamic(() => import('../components/AppLayout'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F6F7F9] dark:bg-[#0B0D10] text-slate-800 dark:text-slate-200 p-6">
      <div className="animate-pulse mb-3">
        <SightForgeLogo size="lg" variant="mark" />
      </div>
      <p className="text-xs text-slate-500 dark:text-[#A8B0BB] font-medium">
        Connecting to {BRAND.name}...
      </p>
    </div>
  ),
});

export default function App() {
  return (
    <div className="min-h-screen antialiased">
      <AppLayout />
    </div>
  );
}
