import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { LoginForm } from '@/components/admin/LoginForm';
import { SetupGuide } from '@/components/admin/SetupGuide';
import { Monogram } from '@/components/story/Monogram';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <SetupGuide />
      </main>
    );
  }

  const session = await getAdminSession();
  if (session?.isAdmin) redirect('/admin');

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Monogram initials="K & R" size="md" />
          <h1 className="mt-6 font-display text-3xl font-light text-cream">
            The keeper&apos;s entrance
          </h1>
          <p className="mt-2 font-serif text-sm italic text-mauve-300">
            Sign in to add to the story.
          </p>
        </div>
        <LoginForm alreadySignedIn={Boolean(session)} />
      </div>
    </main>
  );
}
