'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/admin', label: 'Memories' },
  { href: '/admin/settings', label: 'Site & music' },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    await getBrowserSupabase()?.auth.signOut();
    router.refresh();
    router.push('/admin/login');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-champagne/12 bg-midnight-900/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/admin" className="monogram foil text-lg">
          K &amp; R
        </Link>

        <nav className="flex gap-1" aria-label="Admin sections">
          {LINKS.map((link) => {
            const active =
              link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-full px-3.5 py-2 font-sans text-[0.76rem] tracking-[0.08em] transition-colors',
                  active
                    ? 'bg-champagne/15 text-champagne-light'
                    : 'text-mauve-300 hover:text-cream',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            rel="noopener"
            className="btn-ghost !min-h-0 !py-2 !text-[0.7rem]"
          >
            View site ↗
          </Link>
          <button
            type="button"
            onClick={signOut}
            title={email}
            className="btn-ghost !min-h-0 !py-2 !text-[0.7rem]"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
