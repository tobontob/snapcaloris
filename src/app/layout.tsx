import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ec4899',
};

export const metadata: Metadata = {
  title: 'CaloriSnap - 음식 사진으로 칼로리 계산하기',
  description: '음식 사진을 업로드하면 AI가 자동으로 음식을 인식하고 칼로리를 계산해주는 서비스입니다.',
  keywords: '칼로리 계산, 음식 인식, AI, 다이어트, 건강',
  authors: [{ name: 'CaloriSnap Team' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={inter.className}>
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
} 