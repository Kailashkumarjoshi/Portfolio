import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter, Lora } from 'next/font/google';
import './globals.css';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const bodySerif = Lora({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-body-serif',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'K & R — Our Story',
  description: 'A keepsake of every memory, stitched together one thread at a time.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'K & R — Our Story',
    description: 'A keepsake of every memory, stitched together one thread at a time.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#140a12',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${bodySerif.variable} ${sans.variable}`}>
      <body className="min-h-screen antialiased">
        <div className="romantic-ground" aria-hidden="true" />
        <div className="romantic-candle" aria-hidden="true" />
        <div className="romantic-grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
