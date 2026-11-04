import Link from 'next/link';
import { getStory } from '@/lib/data/story';
import { EventForm } from '@/components/admin/EventForm';

export const dynamic = 'force-dynamic';

export default async function NewMemoryPage() {
  const { events, settings } = await getStory(true);
  const chapters = Array.from(
    new Set(events.map((e) => e.chapter).filter((c): c is string => Boolean(c))),
  );

  return (
    <div>
      <Link
        href="/admin"
        className="font-sans text-xs uppercase tracking-[0.16em] text-mauve-300 transition-colors hover:text-cream"
      >
        ← All memories
      </Link>
      <h1 className="mb-8 mt-3 font-display text-4xl font-light text-cream">A new memory</h1>
      <EventForm event={null} initials={settings.initials} chapters={chapters} />
    </div>
  );
}
