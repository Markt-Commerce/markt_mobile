import type { ChatMessage, MessageReactionSummary } from "../models/chat";
import { getReactions } from "../services/sections/chat";
import { getEmoji } from "./reactions";

export type MessageReactionSocketEvent = {
  message_id: number | string;
  user_id?: string;
  reaction_type: string;
};

export type MessageReactionStatsEvent = {
  message_id: number | string;
  reactions?: Record<string, number>;
};

/** Normalize GET /chats/messages/:id/reactions (array or wrapped). */
export function normalizeReactionSummaries(raw: unknown): MessageReactionSummary[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { data?: unknown })?.data)
      ? (raw as { data: MessageReactionSummary[] }).data
      : [];
  return list
    .map((r) => ({
      reaction_type: String(r.reaction_type ?? ""),
      emoji: r.emoji ?? getEmoji(String(r.reaction_type ?? "")),
      count: Number(r.count) || 0,
      has_reacted: Boolean(r.has_reacted),
    }))
    .filter((r) => r.reaction_type && r.count > 0);
}

export async function fetchReactionsForMessages(
  messages: ChatMessage[]
): Promise<Map<string, MessageReactionSummary[]>> {
  const numericMsgs = messages.filter((m) => !isNaN(Number(m.id)) && Number(m.id) > 0);
  const results = await Promise.all(
    numericMsgs.map(async (m) => {
      try {
        const reactions = await getReactions(Number(m.id));
        return { id: String(m.id), reactions: normalizeReactionSummaries(reactions) };
      } catch {
        return { id: String(m.id), reactions: [] as MessageReactionSummary[] };
      }
    })
  );
  return new Map(results.map((r) => [r.id, r.reactions]));
}

export function attachReactionsToMessages(
  messages: ChatMessage[],
  reactionMap: Map<string, MessageReactionSummary[]>
): ChatMessage[] {
  return messages.map((m) => {
    const rx = reactionMap.get(String(m.id));
    if (!rx || rx.length === 0) return m;
    return {
      ...m,
      message_data: { ...(m.message_data ?? {}), reactions: rx },
    };
  });
}

export function applyReactionAdded(
  reactions: MessageReactionSummary[],
  reactionType: string,
  isMine: boolean
): MessageReactionSummary[] {
  const idx = reactions.findIndex((r) => r.reaction_type === reactionType);
  if (idx >= 0) {
    const current = reactions[idx];
    if (isMine && current.has_reacted) return reactions;
    return reactions.map((r, i) =>
      i === idx
        ? {
            ...r,
            count: isMine && r.has_reacted ? r.count : r.count + 1,
            has_reacted: r.has_reacted || isMine,
          }
        : r
    );
  }
  return [
    ...reactions,
    {
      reaction_type: reactionType,
      emoji: getEmoji(reactionType),
      count: 1,
      has_reacted: isMine,
    },
  ];
}

export function applyReactionRemoved(
  reactions: MessageReactionSummary[],
  reactionType: string,
  isMine: boolean
): MessageReactionSummary[] {
  const idx = reactions.findIndex((r) => r.reaction_type === reactionType);
  if (idx < 0) return reactions;
  const current = reactions[idx];
  const nextCount = Math.max(0, current.count - 1);
  if (nextCount === 0) return reactions.filter((_, i) => i !== idx);
  return reactions.map((r, i) =>
    i === idx
      ? { ...r, count: nextCount, has_reacted: isMine ? false : r.has_reacted }
      : r
  );
}

export function applyReactionStats(
  existing: MessageReactionSummary[] | undefined,
  stats: Record<string, number> | undefined
): MessageReactionSummary[] {
  if (!stats) return existing ?? [];
  return Object.entries(stats)
    .map(([reaction_type, count]) => {
      const prev = existing?.find((r) => r.reaction_type === reaction_type);
      return {
        reaction_type,
        emoji: getEmoji(reaction_type),
        count: Number(count) || 0,
        has_reacted: prev?.has_reacted ?? false,
      };
    })
    .filter((r) => r.count > 0);
}
