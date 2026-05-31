/**
 * Chat message reactions
 * Maps reaction_type to emoji; used for display and API calls.
 */

export const REACTION_EMOJIS: Record<string, string> = {
  THUMBS_UP: "👍",
  THUMBS_DOWN: "👎",
  HEART: "❤️",
  FIRE: "🔥",
  STAR: "⭐",
  MONEY: "💰",
  SHOPPING: "🛒",
  CHECK: "✅",
  EYES: "👀",
  CLAP: "👏",
  ROCKET: "🚀",
  SMILE: "😊",
} as const;

export type ReactionType = keyof typeof REACTION_EMOJIS;

export interface ReactionSummary {
  reaction_type: string;
  emoji: string;
  count: number;
  has_reacted: boolean;
}

/** Common reactions for picker (4–6 per contract §3.4) */
export const COMMON_REACTIONS: ReactionType[] = [
  "HEART",
  "THUMBS_UP",
  "FIRE",
  "STAR",
  "CLAP",
  "ROCKET",
];

export function getEmoji(type: string): string {
  return REACTION_EMOJIS[type] ?? type;
}
