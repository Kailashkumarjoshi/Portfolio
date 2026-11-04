import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { SetupGuide } from '@/components/admin/SetupGuide';
import { AdminNav } from '@/components/admin/AdminNav';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <SetupGuide />
      </main>
    );
  }

  const session = await getAdminSession();
  if (!session || !session.isAdmin) redirect('/admin/login');

  return (
    <div className="min-h-screen">
      <AdminNav email={session.user.email ?? ''} />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6">{children}</main>
    </div>
  );
}
