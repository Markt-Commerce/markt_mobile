// /services/chatApi.ts
import { request, BASE_URL } from "../api";
import { ChatMessage, RoomListResponse, MessagesResponse, OfferPayload, ChatRoomLite } from "../../models/chat";

/**
 * Get user's rooms (paginated)
 */
export async function getRooms(page = 1, per_page = 20): Promise<RoomListResponse> {
  const res = await request<RoomListResponse>(`${BASE_URL}/chats/rooms?page=${page}&per_page=${per_page}`, {
    method: "GET",
  });
  return res!;
}

/**
 * Create or get a room with buyer/seller/product/request
 */
export async function createOrGetRoom(payload: {
  buyer_id?: string;
  seller_id?: string;
  product_id?: string;
  request_id?: string;
}): Promise<ChatRoomLite> {
  const res = await request<ChatRoomLite>(`${BASE_URL}/chats/rooms`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res!;
}

/**
 * Get messages for a room (paginated)
 */
export async function getRoomMessages(room_id: number, page = 1, per_page = 50): Promise<MessagesResponse> {
  const res = await request<MessagesResponse>(`${BASE_URL}/chats/rooms/${room_id}/messages?page=${page}&per_page=${per_page}`, {
    method: "GET",
  });
  return res!;
}

/**
 * Send message (fallback HTTP option). Server expects content, message_type, message_data optional.
 */
export async function sendMessageREST(room_id: number, body: { content: string; message_type: string; message_data?: any }): Promise<ChatMessage> {
  const res = await request<ChatMessage>(`${BASE_URL}/chats/rooms/${room_id}/messages`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res!;
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
 * Reactions
 */
export async function getReactions(message_id: number): Promise<any[]> {
  const res = await request<any[]>(`${BASE_URL}/chats/messages/${message_id}/reactions`, {
    method: "GET",
  });
  return res!;
}

export async function addReaction(message_id: number, reaction_type = "THUMBS_UP"): Promise<void> {
  await request<void>(`${BASE_URL}/chats/messages/${message_id}/reactions`, {
    method: "POST",
    body: JSON.stringify({ reaction_type }),
  });
}

export async function removeReaction(message_id: number, reaction_type = "THUMBS_UP"): Promise<void> {
  await request<void>(`${BASE_URL}/chats/messages/${message_id}/reactions/${reaction_type}`, {
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
 * Mock: attach product to chat via REST (since server doesn't expose it yet).
 * We'll pretend it returns a message with message_type 'product'.
 */
export async function sendProductMessageMock(room_id: number, product_id: string, note?: string): Promise<ChatMessage> {
  // This is a mock — you should replace with real endpoint once available
  const now = new Date().toISOString();
  return {
    id: Math.floor(Math.random() * 1000000),
    room_id,
    sender_id: "ME",
    content: note ?? "",
    message_type: "product",
    message_data: { product_id },
    is_read: false,
    created_at: now,
  };
}
