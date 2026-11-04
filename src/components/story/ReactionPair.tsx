import { cn } from '@/lib/utils';

interface ReactionPairProps {
  initials: string;
  reactionK: string | null;
  reactionR: string | null;
  /** `quiet` sits inside a card; `full` is the headed block in the detail view. */
  variant?: 'quiet' | 'full';
  className?: string;
}

function splitInitials(initials: string): [string, string] {
  const letters = initials.replace(/[^\p{L}]/gu, '').split('');
  return [letters[0] ?? 'K', letters[1] ?? 'R'];
}

/**
 * How the two of them felt about a memory. Deliberately not a like counter:
 * two names, two faces, no totals, nothing to press.
 */
export function ReactionPair({
  initials,
  reactionK,
  reactionR,
  variant = 'quiet',
  className,
}: ReactionPairProps) {
  if (!reactionK && !reactionR) return null;
  const [k, r] = splitInitials(initials);

  if (variant === 'quiet') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        {reactionK && <QuietMark letter={k} emoji={reactionK} />}
        {reactionR && <QuietMark letter={r} emoji={reactionR} />}
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="kicker mb-4 text-champagne/70">How we felt about this memory</h3>
      <div className="flex flex-wrap gap-3">
        {reactionK && <FullMark letter={k} emoji={reactionK} />}
        {reactionR && <FullMark letter={r} emoji={reactionR} />}
      </div>
    </div>
  );
}

function QuietMark({ letter, emoji }: { letter: string; emoji: string }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={`${letter} felt ${emoji}`}>
      <span className="font-display text-[0.72rem] tracking-[0.2em] text-ink/45">{letter}</span>
      <span className="text-base leading-none" role="img" aria-label={`${letter} reacted ${emoji}`}>
        {emoji}
      </span>
    </span>
  );
}

function FullMark({ letter, emoji }: { letter: string; emoji: string }) {
  return (
    <span className="frost inline-flex items-center gap-3 rounded-full py-2 pl-4 pr-5">
      <span className="font-display text-sm tracking-[0.24em] text-champagne/80">{letter}</span>
      <span className="h-4 w-px bg-champagne/25" aria-hidden="true" />
      <span className="text-2xl leading-none" role="img" aria-label={`${letter} reacted ${emoji}`}>
        {emoji}
      </span>
    </span>
  );
}
