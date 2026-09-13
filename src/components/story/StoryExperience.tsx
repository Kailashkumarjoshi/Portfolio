'use client';

import type { SiteSettings, StoryEvent } from '@/lib/types';
import { MusicProvider } from './MusicProvider';
import { MusicPlayer } from './MusicPlayer';
import { EntryScreen } from './EntryScreen';
import { Hero } from './Hero';
import { Timeline } from './Timeline';
import { StoryFooter } from './StoryFooter';

/** Everything the visitor sees, wrapped in the one shared music context. */
export function StoryExperience({
  events,
  settings,
}: {
  events: StoryEvent[];
  settings: SiteSettings;
}) {
  return (
    <MusicProvider globalSong={settings.global_song}>
      <a href="#story" className="skip-link">
        Skip to the memories
      </a>

      <EntryScreen
        initials={settings.initials}
        kicker={settings.hero_kicker}
        label={settings.enter_label}
        enabled={settings.entry_screen_enabled}
      />

      <main>
        <Hero settings={settings} memoryCount={events.length} />
        <div id="story-top" />
        {events.length > 0 ? (
          <Timeline events={events} settings={settings} />
        ) : (
          <EmptyStory />
        )}
      </main>

      <StoryFooter initials={settings.initials} note={settings.footer_note} />
      <MusicPlayer />
    </MusicProvider>
  );
}

function EmptyStory() {
  return (
    <section id="story" className="mx-auto max-w-md px-6 py-28 text-center">
      <p className="font-display text-3xl font-light text-cream">The first memory is waiting.</p>
      <p className="mt-4 font-serif leading-relaxed text-mauve-200">
        Nothing has been added yet. Sign in to the keeper&apos;s panel and the thread will
        start itself.
      </p>
      <a href="/admin" className="btn-ghost mt-8">
        Open the admin panel
      </a>
    </section>
  );
}
