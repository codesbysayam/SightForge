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
    { media: '(prefers-color-scheme: light)', color: '#F6F7F9' },
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('sightforge_theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored === 'dark' || (!stored && prefersDark) || stored === 'system' && prefersDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen selection:bg-blue-500/20 selection:text-blue-900 dark:selection:text-blue-100">
        {children}
      </body>
    </html>
  );
}
