import Link from 'next/link';
import { Monogram } from './Monogram';

export function StoryFooter({
  initials,
  note,
}: {
  initials: string;
  note: string | null;
}) {
  return (
    <footer className="relative border-t border-champagne/10 px-6 py-16 text-center">
      <Monogram initials={initials} size="sm" />
      {note && (
        <p className="mx-auto mt-6 max-w-sm font-serif text-sm italic leading-relaxed text-mauve-300">
          {note}
        </p>
      )}
      <p className="mt-8 font-sans text-[0.6rem] uppercase tracking-[0.22em] text-mauve-400/50">
        <Link href="/admin" className="transition-colors hover:text-champagne/70">
          Keeper&apos;s entrance
        </Link>
      </p>
    </footer>
  );
}
