'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';

export function LoginForm({ alreadySignedIn }: { alreadySignedIn: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError('The database is not connected yet.');
      setBusy(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setBusy(false);
      return;
    }

    router.refresh();
    router.push('/admin');
  };

  const signOut = async () => {
    const supabase = getBrowserSupabase();
    await supabase?.auth.signOut();
    router.refresh();
  };

  return (
    <div className="frost rounded-2xl p-6">
      {alreadySignedIn && (
        <div className="mb-5 rounded-xl border border-champagne/25 bg-champagne/10 p-4">
          <p className="font-sans text-sm leading-relaxed text-cream">
            You are signed in, but this account has not been made a keeper of this story yet.
          </p>
          <p className="help mt-2">
            In Supabase, run the last query in <code>supabase/schema.sql</code> with your email
            address. Then reload this page.
          </p>
          <button type="button" onClick={signOut} className="btn-ghost mt-4">
            Sign out
          </button>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="font-sans text-sm text-rose-300">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="help mt-5">
        Accounts are created in Supabase → Authentication → Users. There is no public sign-up,
        on purpose.
      </p>
    </div>
  );
}
