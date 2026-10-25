import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SIGHTFORGE - Intelligent Computer Vision Platform',
  description: 'Real-time AI computer vision workspace for multi-camera streams, person detection, pose estimation, and edge tracking.',
  openGraph: {
    title: 'SIGHTFORGE - Intelligent Computer Vision Platform',
    description: 'Real-time AI computer vision workspace for multi-camera streams, person detection, pose estimation, and edge tracking.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F7F7F3] text-[#1B1D1A] min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
