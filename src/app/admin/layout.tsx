import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Keeper — K & R',
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
