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

// 구조화된 데이터 추가
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'CaloriSnap',
  description: 'AI 기술로 음식 사진을 분석하여 정확한 칼로리를 계산해주는 서비스입니다.',
  url: 'https://snapcaloris.vercel.app',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KRW'
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '100'
  }
};

export const metadata: Metadata = {
  title: 'CaloriSnap - AI 기반 음식 칼로리 계산기',
  description: 'AI 기술로 음식 사진을 분석하여 정확한 칼로리를 계산해주는 서비스입니다. 다이어트와 건강 관리에 도움을 드립니다.',
  keywords: '칼로리 계산, 음식 인식, AI, 다이어트, 건강, 영양 분석, 식단 관리, 칼로리 트래커, 음식 사진 분석',
  authors: [{ name: 'CaloriSnap Team' }],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'CaloriSnap - AI 기반 음식 칼로리 계산기',
    description: 'AI 기술로 음식 사진을 분석하여 정확한 칼로리를 계산해주는 서비스입니다.',
    url: 'https://snapcaloris.vercel.app',
    siteName: 'CaloriSnap',
    images: [
      {
        url: 'https://snapcaloris.vercel.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CaloriSnap - AI 기반 음식 칼로리 계산기',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CaloriSnap - AI 기반 음식 칼로리 계산기',
    description: 'AI 기술로 음식 사진을 분석하여 정확한 칼로리를 계산해주는 서비스입니다.',
    images: ['https://snapcaloris.vercel.app/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification',
    daum: 'your-daum-site-verification',
  },
  metadataBase: new URL('https://snapcaloris.vercel.app'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={inter.className}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
} 