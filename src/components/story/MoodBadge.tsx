import { moodTheme } from '@/lib/moods';
import type { MoodKey } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Small, quiet label. The mood does its real work through light, not text. */
export function MoodBadge({
  mood,
  className,
  tone = 'light',
}: {
  mood: MoodKey | null;
  className?: string;
  tone?: 'light' | 'dark';
}) {
  if (!mood) return null;
  const theme = moodTheme(mood);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-sans text-[0.62rem] uppercase tracking-[0.18em]',
        tone === 'light'
          ? 'border-ink/12 bg-ink/[0.04] text-ink/55'
          : 'border-champagne/25 bg-white/5 text-mauve-200',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: theme.accent, boxShadow: `0 0 8px ${theme.accent}` }}
      />
      {theme.label}
    </span>
  );
}
