import Link from 'next/link';
import { getStory } from '@/lib/data/story';
import { MemoryManager } from '@/components/admin/MemoryManager';

export const dynamic = 'force-dynamic';

export default async function AdminHomePage() {
  const { events, error } = await getStory(true);
  const published = events.filter((e) => e.is_published).length;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-champagne/60">Your story</p>
          <h1 className="mt-2 font-display text-4xl font-light text-cream">Memories</h1>
          <p className="mt-2 font-sans text-sm text-mauve-300">
            {events.length} in all · {published} showing on the site
          </p>
        </div>
        <Link href="/admin/memories/new" className="btn-primary">
          Add a memory
        </Link>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-6 rounded-xl border border-rose-400/30 bg-rose-900/20 p-4 font-sans text-sm text-rose-200"
        >
          Could not read the story: {error}
        </p>
      )}

      <MemoryManager events={events} />
    </div>
  );
}
