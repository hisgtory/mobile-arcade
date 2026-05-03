import type { Metadata, Viewport } from 'next';
import { Bagel_Fat_One, Fredoka } from 'next/font/google';
import './globals.css';

const bagel = Bagel_Fat_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bagel',
  display: 'swap',
});

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://arcade.hisgtory.com'),
  title: {
    default: 'Arcade',
    template: '%s · Arcade',
  },
  description: '매일매일 새로운 미니게임을 만나보세요.',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Arcade',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FFF8F0',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${bagel.variable} ${fredoka.variable}`}>
      <body className="font-body text-slate-800">{children}</body>
    </html>
  );
}
