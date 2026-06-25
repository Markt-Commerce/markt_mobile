// /services/chatApi.ts
import { request, BASE_URL } from "../api";
import {
  ChatMessage,
  RoomListResponse,
  MessagesResponse,
  OfferPayload,
  ChatRoomLite,
  MessageReactionSummary,
} from "../../models/chat";

export const DEFAULT_PRODUCT_INQUIRY = "Hi, is this still available?";

function unwrapChat<T>(res: T | { data: T }): T {
  if (res && typeof res === "object" && "data" in res && (res as { data?: T }).data != null) {
    return (res as { data: T }).data;
  }
  return res as T;
}

/**
 * Get user's rooms (paginated)
 */
export async function getRooms(page = 1, per_page = 20): Promise<RoomListResponse> {
  const res = await request<RoomListResponse | { data: RoomListResponse }>(`${BASE_URL}/chats/rooms?page=${page}&per_page=${per_page}`, {
    method: "GET",
  });
  return unwrapChat(res!);
}

/**
 * Create or get a 1:1 room between buyer and seller.
 * One room per buyer–seller pair; product_id is optional room metadata only.
 */
export async function createOrGetRoom(payload: {
  buyer_id?: string;
  seller_id?: string;
  product_id?: string;
  request_id?: string;
}): Promise<ChatRoomLite> {
  const res = await request<ChatRoomLite | { data: ChatRoomLite }>(`${BASE_URL}/chats/rooms`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return unwrapChat(res!);
}

/**
 * Get messages for a room (paginated)
 */
export async function getRoomMessages(room_id: number, page = 1, per_page = 50): Promise<MessagesResponse> {
  const res = await request<MessagesResponse | { data: MessagesResponse }>(`${BASE_URL}/chats/rooms/${room_id}/messages?page=${page}&per_page=${per_page}`, {
    method: "GET",
  });
  return unwrapChat(res!);
}

/**
 * Send message via REST. Server expects content, message_type, optional message_data.
 */
export async function sendMessageREST(room_id: number, body: { content: string; message_type: string; message_data?: any }): Promise<ChatMessage> {
  const res = await request<ChatMessage | { data: ChatMessage }>(`${BASE_URL}/chats/rooms/${room_id}/messages`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return unwrapChat(res!);
}

/** Product context message — use when opening chat from a product page or sharing a listing. */
export async function sendProductMessage(
  room_id: number,
  product_id: string,
  content: string = DEFAULT_PRODUCT_INQUIRY
): Promise<ChatMessage> {
  return sendMessageREST(room_id, {
    content,
    message_type: "product",
    message_data: { product_id },
  });
}

/**
 * Mark messages as read in a room
 */
export async function markRoomRead(room_id: number): Promise<void> {
  await request<void>(`${BASE_URL}/chats/rooms/${room_id}/read`, {
    method: "POST",
  });
}

/**
 * Reactions — CHAT_MESSAGE_REACTIONS_API §1.2–1.4
 */
export async function getReactions(message_id: number): Promise<MessageReactionSummary[]> {
  const res = await request<MessageReactionSummary[] | { data?: MessageReactionSummary[] }>(
    `/chats/messages/${message_id}/reactions`,
    { method: "GET" }
  );
  const raw = (res as { data?: MessageReactionSummary[] })?.data ?? res;
  return Array.isArray(raw) ? raw : [];
}

export async function addReaction(message_id: number, reaction_type = "THUMBS_UP"): Promise<void> {
  await request<void>(`/chats/messages/${message_id}/reactions`, {
    method: "POST",
    body: JSON.stringify({ reaction_type }),
  });
}

export async function removeReaction(message_id: number, reaction_type = "THUMBS_UP"): Promise<void> {
  await request<void>(`/chats/messages/${message_id}/reactions/${encodeURIComponent(reaction_type)}`, {
    method: "DELETE",
  });
}

/**
 * Offers (HTTP fallback). Preferred: socket 'send_offer'
 */
export async function sendOfferREST(room_id: number, payload: OfferPayload): Promise<any> {
  const res = await request<any>(`${BASE_URL}/chats/rooms/${room_id}/offers`, {
    method: "POST",
    body: JSON.stringify({
      product_id: payload.product_id,
      price: payload.price,
      message: payload.message,
    }),
  });
  return res!;
}

/**
 * Room discounts (CHATS_API §2.8)
 */
export async function getRoomDiscounts(room_id: number): Promise<any[]> {
  const res = await request<any>(`${BASE_URL}/chats/rooms/${room_id}/discounts`, { method: "GET" });
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object" && Array.isArray((res as any).items)) return (res as any).items;
  if (res && typeof res === "object" && Array.isArray((res as any).discounts)) return (res as any).discounts;
  return [];
}

export async function respondToDiscount(discount_id: number, body: { response: "accepted" | "rejected"; response_message?: string }): Promise<void> {
  await request<void>(`${BASE_URL}/chats/discounts/${discount_id}/respond`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
