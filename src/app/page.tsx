import { getStory } from '@/lib/data/story';
import { StoryExperience } from '@/components/story/StoryExperience';

// The story is read fresh on each request so a newly published memory shows up
// the moment it is saved, without the owner needing to redeploy anything.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { events, settings } = await getStory();
  return <StoryExperience events={events} settings={settings} />;
}
