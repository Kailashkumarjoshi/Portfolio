-- ===========================================================================
-- K & R — database schema
--
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- It is safe to run more than once.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Who is allowed to edit the story
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

-- SECURITY DEFINER so the check itself is not subject to the policies below,
-- which would otherwise recurse. Locked to an empty search_path.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- The memories
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  subtitle     text,
  event_date   date,
  date_label   text,
  chapter      text,
  description  text,
  sort_order   integer not null default 0,
  is_published boolean not null default false,
  is_milestone boolean not null default false,
  mood         text check (
                 mood is null or mood in (
                   'romantic','funny','emotional','adventure',
                   'special','peaceful','celebration'
                 )
               ),
  reaction_k   text,
  reaction_r   text,

  -- The song for this memory, if it has one of its own.
  song_url            text,
  song_title          text,
  song_artist         text,
  song_start_seconds  numeric not null default 0 check (song_start_seconds >= 0),
  song_end_seconds    numeric check (song_end_seconds is null or song_end_seconds > song_start_seconds),

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists events_sort_order_idx on public.events (sort_order);
create index if not exists events_published_idx  on public.events (is_published, sort_order);
create index if not exists events_date_idx       on public.events (event_date);

-- ---------------------------------------------------------------------------
-- Photos, videos and linked clips
-- ---------------------------------------------------------------------------
create table if not exists public.event_media (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events (id) on delete cascade,
  kind         text not null default 'photo' check (kind in ('photo','video','embed')),
  url          text not null,
  storage_path text,
  caption      text,
  poster_url   text,
  width        integer,
  height       integer,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists event_media_event_idx on public.event_media (event_id, sort_order);

-- ---------------------------------------------------------------------------
-- Everything the owner can rename without touching code
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  id                    uuid primary key default gen_random_uuid(),
  initials              text not null default 'K & R',
  hero_kicker           text default 'a keepsake for two',
  hero_title            text not null default 'Our Story',
  hero_subtitle         text,
  enter_label           text not null default 'Begin Our Journey',
  footer_note           text,
  entry_screen_enabled  boolean not null default true,
  default_sort          text not null default 'story'
                          check (default_sort in ('story','story_desc','oldest','newest')),

  global_song_url           text,
  global_song_title         text,
  global_song_artist        text,
  global_song_start_seconds numeric not null default 0 check (global_song_start_seconds >= 0),
  global_song_end_seconds   numeric,

  updated_at timestamptz not null default now()
);

-- Exactly one settings row, ever.
create unique index if not exists site_settings_singleton on public.site_settings ((true));

insert into public.site_settings (hero_subtitle, footer_note)
select
  'Every memory, stitched to the next — one soft thread running all the way from the beginning to right now.',
  'Made slowly, and only for us.'
where not exists (select 1 from public.site_settings);

-- ---------------------------------------------------------------------------
-- Keep updated_at honest
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_touch_updated_at on public.events;
create trigger events_touch_updated_at
  before update on public.events
  for each row execute function public.touch_updated_at();

drop trigger if exists site_settings_touch_updated_at on public.site_settings;
create trigger site_settings_touch_updated_at
  before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ===========================================================================
-- Row level security
--
-- Visitors may read published memories and the site settings, and nothing
-- else. Everything that writes requires an account listed in admin_users.
-- ===========================================================================

alter table public.events        enable row level security;
alter table public.event_media   enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_users   enable row level security;

-- events -------------------------------------------------------------------
drop policy if exists "published events are public" on public.events;
create policy "published events are public"
  on public.events for select
  using (is_published or public.is_admin());

drop policy if exists "admins write events" on public.events;
create policy "admins write events"
  on public.events for all
  using (public.is_admin())
  with check (public.is_admin());

-- event_media --------------------------------------------------------------
drop policy if exists "media of published events is public" on public.event_media;
create policy "media of published events is public"
  on public.event_media for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.events e
      where e.id = event_media.event_id and e.is_published
    )
  );

drop policy if exists "admins write media" on public.event_media;
create policy "admins write media"
  on public.event_media for all
  using (public.is_admin())
  with check (public.is_admin());

-- site_settings ------------------------------------------------------------
drop policy if exists "settings are public" on public.site_settings;
create policy "settings are public"
  on public.site_settings for select
  using (true);

drop policy if exists "admins write settings" on public.site_settings;
create policy "admins write settings"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- admin_users --------------------------------------------------------------
-- Readable only by admins, and never writable from the browser: adding a
-- keeper is done from the Supabase dashboard or with the service role key.
drop policy if exists "admins read the keeper list" on public.admin_users;
create policy "admins read the keeper list"
  on public.admin_users for select
  using (public.is_admin());

-- ===========================================================================
-- Storage
-- ===========================================================================

insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do update set public = true;

drop policy if exists "memories are publicly readable" on storage.objects;
create policy "memories are publicly readable"
  on storage.objects for select
  using (bucket_id = 'memories');

drop policy if exists "admins upload memories" on storage.objects;
create policy "admins upload memories"
  on storage.objects for insert
  with check (bucket_id = 'memories' and public.is_admin());

drop policy if exists "admins update memories" on storage.objects;
create policy "admins update memories"
  on storage.objects for update
  using (bucket_id = 'memories' and public.is_admin())
  with check (bucket_id = 'memories' and public.is_admin());

drop policy if exists "admins delete memories" on storage.objects;
create policy "admins delete memories"
  on storage.objects for delete
  using (bucket_id = 'memories' and public.is_admin());

-- ===========================================================================
-- Last step, once you have created your own account:
--
--   insert into public.admin_users (user_id, email)
--   select id, email from auth.users where email = 'you@example.com';
--
-- Run that for each person who should be able to edit the story.
-- ===========================================================================
