import { getStory } from '@/lib/data/story';
import { SettingsForm } from '@/components/admin/SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const { settings } = await getStory(true);

  return (
    <div>
      <p className="kicker text-champagne/60">The whole site</p>
      <h1 className="mb-8 mt-2 font-display text-4xl font-light text-cream">Site &amp; music</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
