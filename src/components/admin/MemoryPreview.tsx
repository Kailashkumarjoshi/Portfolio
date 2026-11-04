'use client';

import type { StoryEvent } from '@/lib/types';
import { MemoryCard } from '@/components/story/MemoryCard';

/**
 * The live preview is the real memory card, not a mock-up of one — so what the
 * keeper sees here is exactly what a visitor gets, down to the knot on the edge.
 */
export function MemoryPreview({
  event,
  initials,
}: {
  event: StoryEvent;
  initials: string;
}) {
  return (
    <div className="relative rounded-[1.5rem] bg-midnight-800/40 p-5">
      <MemoryCard
        event={event}
        index={0}
        side="left"
        initials={initials}
        onOpen={() => {}}
        ordinal={event.sort_order || 1}
        instant
      />
      {!event.is_published && (
        <p className="mt-5 text-center font-sans text-[0.66rem] uppercase tracking-[0.18em] text-mauve-400">
          Hidden — only you can see this
        </p>
      )}
    </div>
  );
}
