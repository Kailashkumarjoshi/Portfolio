import type { MoodKey } from './types';

export interface MoodTheme {
  key: MoodKey;
  label: string;
  /** One-line hint shown in the admin picker. */
  hint: string;
  /** Accent used for glows, knots and small flourishes. */
  accent: string;
  /** Very low-opacity wash placed behind the card. Never recolours the page. */
  wash: string;
  /** Tint applied to the yarn as it leaves this memory. */
  yarn: string;
  /** Drifting particle character; null = no particles. */
  particle: string | null;
  particleCount: number;
}

export const MOODS: Record<MoodKey, MoodTheme> = {
  romantic: {
    key: 'romantic',
    label: 'Romantic',
    hint: 'Candlelit, tender, close.',
    accent: '#d49aa4',
    wash: 'rgba(196,129,143,0.16)',
    yarn: '#c4818f',
    particle: '✦',
    particleCount: 5,
  },
  funny: {
    key: 'funny',
    label: 'Funny',
    hint: 'The one you still laugh about.',
    accent: '#e3c9a0',
    wash: 'rgba(244,205,180,0.16)',
    yarn: '#c78f80',
    particle: '✺',
    particleCount: 6,
  },
  emotional: {
    key: 'emotional',
    label: 'Emotional',
    hint: 'Tears, the good kind.',
    accent: '#cfc2de',
    wash: 'rgba(207,194,222,0.16)',
    yarn: '#ab8fa8',
    particle: '·',
    particleCount: 7,
  },
  adventure: {
    key: 'adventure',
    label: 'Adventure',
    hint: 'Somewhere new, together.',
    accent: '#c9b18e',
    wash: 'rgba(201,177,142,0.15)',
    yarn: '#b98d84',
    particle: '✧',
    particleCount: 5,
  },
  special: {
    key: 'special',
    label: 'Special',
    hint: 'A day that changed things.',
    accent: '#e8d3a8',
    wash: 'rgba(232,211,168,0.17)',
    yarn: '#c9a081',
    particle: '✦',
    particleCount: 8,
  },
  peaceful: {
    key: 'peaceful',
    label: 'Peaceful',
    hint: 'Quiet, unhurried, safe.',
    accent: '#bfc7c2',
    wash: 'rgba(191,199,194,0.13)',
    yarn: '#a8919c',
    particle: null,
    particleCount: 0,
  },
  celebration: {
    key: 'celebration',
    label: 'Celebration',
    hint: 'Something worth raising a glass to.',
    accent: '#efd9a4',
    wash: 'rgba(239,217,164,0.18)',
    yarn: '#cda487',
    particle: '✷',
    particleCount: 9,
  },
};

export const MOOD_LIST: MoodTheme[] = Object.values(MOODS);

/** Neutral fallback so an event with no mood still looks intentional. */
export const NEUTRAL_MOOD: MoodTheme = {
  key: 'romantic',
  label: 'Untagged',
  hint: '',
  accent: '#c9a6b4',
  wash: 'rgba(169,127,151,0.10)',
  yarn: '#bd8496',
  particle: null,
  particleCount: 0,
};

export function moodTheme(mood: MoodKey | null | undefined): MoodTheme {
  if (!mood) return NEUTRAL_MOOD;
  return MOODS[mood] ?? NEUTRAL_MOOD;
}
