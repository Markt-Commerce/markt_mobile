import type { ChatMessage } from "../models/chat";
import { normalizeUri } from "./imageUri";

export type ChatOtherUser = {
  id?: string;
  username?: string;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
};

export function pickProfilePicture(
  source?: { profile_picture?: string | null; profile_picture_url?: string | null } | null
): string | undefined {
  const raw = source?.profile_picture_url ?? source?.profile_picture;
  const normalized = normalizeUri(raw ?? undefined);
  return normalized ?? undefined;
}

/** Fill missing sender avatar/name from room peer or current user profile. */
export function enrichChatMessage(
  msg: ChatMessage,
  ctx: { myId: string; otherUser?: ChatOtherUser; myProfile?: ChatOtherUser }
): ChatMessage {
  const sender = ((msg as { sender?: ChatOtherUser }).sender ?? {}) as ChatOtherUser;
  const sid = String(msg.sender_id ?? "");
  const isMe = sid === ctx.myId;

  const existingUri = pickProfilePicture(sender);
  const existingName = sender.username ?? msg.sender_username;

  if (isMe) {
    const myUri = pickProfilePicture(ctx.myProfile);
    const myName = ctx.myProfile?.username ?? existingName;
    if (!myUri && !myName && existingUri) return msg;
    return {
      ...msg,
      sender: {
        ...sender,
        username: existingName ?? myName,
        profile_picture: existingUri ?? myUri,
        profile_picture_url: existingUri ?? myUri,
      },
    } as ChatMessage;
  }

  const otherUri = pickProfilePicture(ctx.otherUser);
  const otherName = ctx.otherUser?.username;

  if (existingUri && existingName) return msg;

  return {
    ...msg,
    sender: {
      ...sender,
      id: sender.id ?? ctx.otherUser?.id,
      username: existingName ?? otherName,
      profile_picture: existingUri ?? otherUri,
      profile_picture_url: existingUri ?? otherUri,
    },
  } as ChatMessage;
}

export function getMessageAvatarProps(
  item: ChatMessage,
  isMe: boolean,
  ctx: { myId: string; otherUser?: ChatOtherUser; myProfile?: ChatOtherUser }
): { uri: string | null | undefined; name: string | null | undefined } {
  const sender = enrichChatMessage(item, ctx).sender as ChatOtherUser | undefined;
  if (isMe) {
    return {
      uri: pickProfilePicture(sender) ?? pickProfilePicture(ctx.myProfile) ?? null,
      name: sender?.username ?? ctx.myProfile?.username ?? null,
    };
  }
  return {
    uri: pickProfilePicture(sender) ?? pickProfilePicture(ctx.otherUser) ?? null,
    name: sender?.username ?? item.sender_username ?? ctx.otherUser?.username ?? null,
  };
}
