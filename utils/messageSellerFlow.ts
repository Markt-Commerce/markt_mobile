import {
  createOrGetRoom,
  getRoomMessages,
  sendProductMessage,
  DEFAULT_PRODUCT_INQUIRY,
} from "../services/sections/chat";
import type { ChatMessage, ChatRoomLite } from "../models/chat";

/** Dedup auto-send within app session: `${roomId}:${productId}` */
const sessionProductMessageKeys = new Set<string>();

export type MessageSellerOtherUser = {
  username?: string;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
};

export type MessageSellerFlowParams = {
  sellerUserId: string;
  productId: string;
  otherUser?: MessageSellerOtherUser;
};

export type MessageSellerFlowResult = {
  room: ChatRoomLite;
  productMessageSent: boolean;
};

function threadHasProductMessage(
  messages: ChatMessage[],
  productId: string
): boolean {
  return messages.some((m) => {
    if (m.message_type !== "product") return false;
    const pid =
      m.message_data?.product_id ??
      (m.message_data?.product as { id?: string } | undefined)?.id;
    return String(pid) === productId;
  });
}

/**
 * Open (or reuse) buyer–seller room, send product context message, return room id.
 * One room per buyer–seller pair; product context lives in the message thread.
 */
export async function runMessageSellerFlow(
  params: MessageSellerFlowParams
): Promise<MessageSellerFlowResult> {
  const { sellerUserId, productId } = params;

  const room = await createOrGetRoom({
    seller_id: sellerUserId,
    product_id: productId,
  });

  const roomId = room.id;
  const sessionKey = `${roomId}:${productId}`;

  if (sessionProductMessageKeys.has(sessionKey)) {
    return { room, productMessageSent: false };
  }

  const history = await getRoomMessages(roomId, 1, 50);
  const messages = history.messages ?? [];

  if (threadHasProductMessage(messages, productId)) {
    sessionProductMessageKeys.add(sessionKey);
    return { room, productMessageSent: false };
  }

  await sendProductMessage(roomId, productId, DEFAULT_PRODUCT_INQUIRY);
  sessionProductMessageKeys.add(sessionKey);

  return { room, productMessageSent: true };
}

/** Reset session dedup (e.g. after logout). */
export function resetMessageSellerSessionDedup(): void {
  sessionProductMessageKeys.clear();
}