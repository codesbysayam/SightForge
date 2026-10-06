import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BRAND } from '../config/brand';

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} | ${BRAND.descriptor}`,
    template: `%s | ${BRAND.name}`,
  },
  description:
    'Real-time computer vision, object detection, multi-object tracking, and edge analytics.',
  applicationName: BRAND.name,
  openGraph: {
    title: `${BRAND.name} | ${BRAND.descriptor}`,
    description:
      'Real-time computer vision, object detection, multi-object tracking, and edge analytics.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.name} | ${BRAND.descriptor}`,
    description:
      'Real-time computer vision, object detection, multi-object tracking, and edge analytics.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F7F3' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0D10' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-[#F7F7F3] text-[#1B1D1A]">
        {children}
      </body>
    </html>
  );
}
