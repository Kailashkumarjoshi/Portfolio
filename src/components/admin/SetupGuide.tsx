/**
 * What a non-technical owner sees before the database is connected.
 * It is the only place in the app that talks about configuration, and it is
 * written to be followed start to finish without help.
 */
export function SetupGuide() {
  const steps = [
    {
      title: 'Make a free Supabase project',
      body: 'Go to supabase.com, sign up, and create a new project. Give it any name. Wait for it to finish setting up — it takes a minute or two.',
    },
    {
      title: 'Create the tables',
      body: 'In your project, open the SQL Editor, click New query, paste in the whole contents of the file supabase/schema.sql from this project, and press Run. You should see "Success".',
    },
    {
      title: 'Copy your two keys',
      body: 'Open Project Settings → API. Copy the Project URL and the anon public key.',
    },
    {
      title: 'Paste them into the site',
      body: 'In your hosting dashboard (Vercel, Netlify, wherever this site lives), add two environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Paste in the two values, then redeploy.',
    },
    {
      title: 'Make yourself the keeper',
      body: 'In Supabase, open Authentication → Users → Add user, and create an account with your email and a password. Then open the SQL Editor again and run the last query at the bottom of schema.sql, with your email in it.',
    },
    {
      title: 'Sign in and start writing',
      body: 'Come back to this page and sign in. Everything after this is done from the admin panel — you will never need to touch code again.',
    },
  ];

  return (
    <div className="frost rounded-2xl p-6 sm:p-9">
      <p className="kicker text-champagne/70">First-time setup</p>
      <h1 className="mt-3 font-display text-3xl font-light text-cream sm:text-4xl">
        Six steps, once.
      </h1>
      <p className="mt-3 max-w-prose font-serif leading-relaxed text-mauve-200">
        The story you can see right now is a sample, so you can tell what the site looks like
        full. To put your own memories in it, connect a database. It is free, and you only
        ever do this once.
      </p>

      <ol className="mt-9 space-y-6">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-champagne/30 font-display text-sm text-champagne">
              {i + 1}
            </span>
            <div className="pt-1">
              <h2 className="font-display text-xl font-light text-cream">{step.title}</h2>
              <p className="mt-1.5 max-w-prose font-sans text-sm leading-relaxed text-mauve-200">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <hr className="hairline my-9" />

      <p className="font-sans text-sm leading-relaxed text-mauve-300">
        Stuck on any of it? Every one of these steps is in the project&apos;s README as well,
        with the same wording.
      </p>
    </div>
  );
}
