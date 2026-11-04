import { z } from 'zod';

/**
 * Free text that may legitimately be left blank. Accepts an empty string, null
 * or a missing key from the form and always stores null, so "" and null never
 * both end up in the database meaning the same thing.
 */
const nullableText = (max = 4000) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null));

const trimmedOptional = nullableText();

const songSchema = z.object({
  url: nullableText(2000),
  title: trimmedOptional,
  artist: trimmedOptional,
  start_seconds: z.number().min(0).max(86400).default(0),
  end_seconds: z.number().min(0).max(86400).nullable().default(null),
});

export const mediaDraftSchema = z.object({
  id: z.string().optional(),
  kind: z.enum(['photo', 'video', 'embed']),
  url: z.string().trim().min(1).max(2000),
  storage_path: z.string().trim().max(500).nullable().default(null),
  caption: nullableText(400),
  poster_url: z.string().trim().max(2000).nullable().default(null),
  width: z.number().int().positive().nullable().default(null),
  height: z.number().int().positive().nullable().default(null),
});

export const eventInputSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, 'Give this memory a title.').max(200),
  subtitle: trimmedOptional,
  event_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a real date, or leave it empty.')
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : null)),
  date_label: trimmedOptional,
  chapter: trimmedOptional,
  description: trimmedOptional,
  mood: z
    .enum(['romantic', 'funny', 'emotional', 'adventure', 'special', 'peaceful', 'celebration'])
    .nullable()
    .default(null),
  reaction_k: z.string().trim().max(16).nullable().default(null),
  reaction_r: z.string().trim().max(16).nullable().default(null),
  is_published: z.boolean().default(false),
  is_milestone: z.boolean().default(false),
  song: songSchema.nullable().default(null),
  media: z.array(mediaDraftSchema).max(40).default([]),
});

export type EventInput = z.input<typeof eventInputSchema>;
export type MediaDraft = z.input<typeof mediaDraftSchema>;

export const settingsInputSchema = z.object({
  initials: z.string().trim().min(1).max(40),
  hero_kicker: trimmedOptional,
  hero_title: z.string().trim().min(1).max(120),
  hero_subtitle: trimmedOptional,
  enter_label: z.string().trim().min(1).max(60),
  footer_note: trimmedOptional,
  entry_screen_enabled: z.boolean().default(true),
  default_sort: z.enum(['story', 'story_desc', 'oldest', 'newest']).default('story'),
  global_song: songSchema.nullable().default(null),
});

export type SettingsInput = z.input<typeof settingsInputSchema>;
