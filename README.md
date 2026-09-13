# K & R — Our Story

A private, digital keepsake: every memory on one page, each one tied to the
next with a thread of wool that draws itself forward as you scroll.

Everything in it — the memories, the photos, the music, the order they are
told in — is managed from an admin panel. You never need to edit code.

---

## What you get

**The story** — a cinematic opening with your monogram, then the memories
themselves, laid out as printed keepsakes on warm paper rather than as web
cards. Between every two memories runs a length of wool, tied through an
eyelet on one card and an eyelet on the next. It grows out of the knot, travels
through the page, and only then does the next memory appear. At the very top
two separate strands fall and twist into one.

**Each memory** opens into a full view: the story as you wrote it, all its
photos and videos, its own song if it has one, and how each of you felt about
it.

**On a phone** the same story runs down a rail on the left with the thread
beside it. It is not a shrunk-down desktop page. Heavy visual effects drop away
on slower devices, and if a visitor has asked their system for less motion,
the thread is simply already there.

**Music** — one song for the whole site, and optionally a different one for a
particular memory, which takes over while that memory is open. You choose the
exact stretch of the song that plays.

---

## Part 1 — Setting it up (once)

You need two free accounts: one for the database ([Supabase](https://supabase.com))
and one to put the site online ([Vercel](https://vercel.com) is the easiest).

### 1. Make the database

1. Sign up at **supabase.com** and create a new project. Any name will do.
   Save the database password somewhere safe. Wait for it to finish setting up.
2. In the left sidebar, open **SQL Editor** → **New query**.
3. Open the file `supabase/schema.sql` from this project, copy **all** of it,
   paste it into the box, and press **Run**. You should see *Success*.

### 2. Get your two keys

In Supabase, open **Project Settings → API**. You need two things:

- **Project URL** — looks like `https://abcdefgh.supabase.co`
- **anon public** key — a long string of letters and numbers

The anon key is safe to put in a website. There is a third key called
`service_role` — never put that one anywhere public.

### 3. Put the site online

1. Push this project to GitHub.
2. Go to **vercel.com**, sign in with GitHub, and click **Add New → Project**.
   Pick this repository.
3. Before deploying, open **Environment Variables** and add these two:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL from step 2 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon public key from step 2 |

4. Click **Deploy**.

### 4. Make yourself the keeper

1. In Supabase, open **Authentication → Users → Add user**. Use your own email
   and pick a password. Tick *Auto Confirm User* if it is offered.
2. Go back to **SQL Editor → New query** and run this, with your own email:

   ```sql
   insert into public.admin_users (user_id, email)
   select id, email from auth.users where email = 'you@example.com';
   ```

   Run it once for each person who should be able to edit the story.

### 5. Sign in

Go to `your-site-address/admin` and sign in with the email and password you
just created. That is the setup finished.

> Until you have done all this, the site shows a **sample story** so you can
> see what it looks like full, and `/admin` shows these same instructions.

---

## Part 2 — Using it

Everything lives at `/admin`. There is also a quiet link at the very bottom of
the public site ("Keeper's entrance").

### Adding a memory

**Memories → Add a memory.**

- **What happened** — the title. This is the only thing that is required.
- **A line underneath** — a short second line, in italics.
- **Date** — pick a real date, *or* write it in words ("Sometime that summer").
  If you write it in words, that is what visitors see.
- **Chapter** — memories sharing a chapter name get a heading above the first
  of them. Leave it blank if you do not want chapters.
- **The story** — write it as you would say it. Leave a blank line between
  paragraphs.
- **Photos & videos** — choose files or drag them in. You can also paste a
  YouTube or Vimeo link. The **first one in the list** is what shows on the
  card, and you can reorder them with the arrows.
- **How you both felt** — pick an emoji for each of you, and a mood. The mood
  adds a soft glow and a few motes of light around that memory. It never
  repaints the rest of the site.
- **A song for this memory** — optional. See *Music* below.
- **Mark as a milestone** — adds a small gold mark, and lets visitors filter to
  only the big ones.
- **Show this on the site** — leave this **off** while you are still writing.
  Nobody can see it until you turn it on.

The panel on the right shows exactly how the memory will look. It is the real
card, not a mock-up.

### Changing the order

On the **Memories** page, drag a memory by the handle on its left. The new
order saves itself. The arrows do the same thing if you prefer them, and they
work with a keyboard.

Visitors can re-sort for themselves (oldest first, newest first, or your
order forwards or backwards) and filter by year, chapter, mood, milestones,
or photos and videos only. You choose which order they see first in
**Site & music**.

### Hiding something

Press **Showing** to turn it into **Hidden**. It stays in your list and keeps
its place; it just is not on the site. Nothing is deleted.

### Music

In **Site & music** you can set one song for the whole site. It starts when a
visitor presses the button on the opening screen — browsers will not play
sound before someone taps something, which is one of the reasons that screen
is there.

For either the site song or a memory's own song:

- **Upload a song**, or paste a link to an audio file.
- **Start at / Stop at** — type times the way you would say them: `1:24`.
  Leave *Stop at* empty to play the whole thing.
- **Listen to this bit** plays exactly what visitors will hear.

The chosen stretch loops quietly. When someone opens a memory that has its own
song, it takes over, and the site song comes back when they close it.

### Naming the site

Also in **Site & music**: your two initials (used for the monogram and beside
each of your reactions), the big title, the lines above and below it, the
button text, and the closing line at the bottom.

---

## Questions you might have

**Can anyone else see it?**
Only memories you have set to *Showing* are public. Hidden ones are not sent to
visitors at all — they are filtered out in the database, not just hidden in the
page. Search engines are asked not to list the site. Anyone with the address
can read the published story, so treat the address as the lock.

**Can I have more than one keeper?**
Yes — run the SQL from step 4 again with the other person's email, after
creating them a user in Supabase.

**How big can photos and videos be?**
Up to 50 MB each. Long videos are usually better uploaded to YouTube as
*Unlisted* and pasted in as a link.

**What happens if I delete a memory?**
It is gone for good, along with its uploaded photos. You are asked to confirm
first. Hiding is almost always what you actually want.

**Something is not loading.**
Check that both environment variables are still set in your hosting dashboard,
and that you ran `supabase/schema.sql` all the way through.

---

## For a developer

Next.js (App Router) · React · TypeScript · Tailwind · Framer Motion · Supabase.

```bash
npm install
cp .env.example .env.local   # optional: fill in to use a real database
npm run dev
```

Without `.env.local` the app serves the bundled story in `content/demo-story.json`,
which is also how the public site behaves before the database is connected.

```
src/lib/yarn.ts               curve geometry and the helical plies
src/components/yarn/          measurement, the stitching sequence, rendering
src/components/story/         the public experience
src/components/admin/         the keeper's panel
src/lib/admin/actions.ts      every write, all behind an admin check
supabase/schema.sql           tables, row-level security, storage policies
```

Writes go through server actions that check `admin_users` and are enforced
again by row-level security, so the anon key alone can only ever read published
memories. Uploads go straight from the browser to Supabase Storage.

```bash
npm run typecheck
npm run build
```
