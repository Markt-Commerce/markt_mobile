/**
 * Chat message reactions
 * Uses reaction_type keys only; icons are rendered at the UI layer.
 */

export const REACTION_TYPES = [
  "THUMBS_UP",
  "THUMBS_DOWN",
  "HEART",
  "FIRE",
  "STAR",
  "MONEY",
  "SHOPPING",
  "CHECK",
  "EYES",
  "CLAP",
  "ROCKET",
  "SMILE",
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number];

export interface ReactionSummary {
  reaction_type: string;
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
