import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEventById, getStory } from '@/lib/data/story';
import { EventForm } from '@/components/admin/EventForm';

export const dynamic = 'force-dynamic';

export default async function EditMemoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [event, { events, settings }] = await Promise.all([getEventById(id), getStory(true)]);
  if (!event) notFound();

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
      <h1 className="mb-8 mt-3 font-display text-4xl font-light text-cream">{event.title}</h1>
      <EventForm event={event} initials={settings.initials} chapters={chapters} />
    </div>
  );
}
