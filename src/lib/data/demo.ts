import demoJson from '../../../content/demo-story.json';
import type { SiteSettings, StoryEvent } from '../types';

interface DemoStory {
  settings: SiteSettings;
  events: StoryEvent[];
}

/** Bundled story used until the owner connects their own Supabase project. */
export const DEMO_STORY = demoJson as unknown as DemoStory;

export function demoEvents(): StoryEvent[] {
  return DEMO_STORY.events.map((e) => ({ ...e, media: [...e.media] }));
}

export function demoSettings(): SiteSettings {
  return { ...DEMO_STORY.settings };
}
