/**
 * Curated emoji set for the "how we felt" reactions.
 * Grouped so the admin picker reads like feelings, not a keyboard.
 */
export interface ReactionGroup {
  label: string;
  emoji: string[];
}

export const REACTION_GROUPS: ReactionGroup[] = [
  { label: 'Love', emoji: ['❤️', '🤍', '🩷', '🥰', '😍', '😘', '🫶', '💕'] },
  { label: 'Tender', emoji: ['🥹', '😌', '☺️', '🫠', '🌙', '🌹', '🦋', '💫'] },
  { label: 'Joy', emoji: ['😂', '🤭', '😜', '😆', '✨', '🎉', '🥂', '🕺'] },
  { label: 'Deep', emoji: ['😢', '😭', '🥺', '😤', '🙏', '🕯️', '🌊', '🍂'] },
];

export const ALL_REACTIONS: string[] = REACTION_GROUPS.flatMap((g) => g.emoji);

export const DEFAULT_REACTION = '❤️';
