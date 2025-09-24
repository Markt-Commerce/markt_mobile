// /models/chat.ts
export type MessageType = "text" | "image" | "video" | "product" | "offer";

export interface ChatRoomLite {
  id: number;
  buyer_id: string;
  seller_id: string;
  product_id?: string;
  request_id?: string;
  last_message_at: string;
  unread_count_buyer: number;
  unread_count_seller: number;
}

export interface ChatMessage {
  id: number | string;
  room_id: number;
  sender_id: string;
  content: string;
  message_type: MessageType;
  message_data?: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
  // client-only
  client_id?: string;
  pending?: boolean;
  error?: string | null;
  sender_username?: string;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
}

export interface RoomListResponse {
  rooms: {
    id: number;
    other_user: {
      id: string;
      username: string;
      profile_picture?: string;
      is_seller?: boolean;
    };
    product?: { id: string; name: string; price: number; image?: string };
    request?: { id: string; title: string; description?: string };
    last_message?: ChatMessage;
    unread_count: number;
    last_message_at: string;
  }[];
  pagination?: PaginationMeta;
}

export interface MessagesResponse {
  messages: ChatMessage[];
  pagination?: PaginationMeta;
}

export interface OfferPayload {
  product_id: string;
  price: number;
  message?: string;
}

export interface ChatRoomListItem {
  id: number;
  other_user: {
    id: string;
    username: string;
    profile_picture?: string;
    is_seller: boolean;
  };
  product?: { id: string; name: string; price: number; image?: string };
  request?: { id: string; title: string; description?: string };
  last_message?: ChatMessage;
  unread_count: number;
  last_message_at: string;
}

// Offers
export interface OfferPayload {
  room_id: number;
  product_id: string;
  offer_amount: number;
  message?: string;
}

export interface OfferMessageData {
  product_id: string;
  product_name?: string;
  product_price?: number;
  offer_amount: number;
  offer_message?: string;
}

export type OfferResponseType = "accept" | "reject" | "counter";

export interface OfferResponsePayload {
  offer_id: number;
  response: OfferResponseType;
  message?: string;
  counter_price?: number;
}

// Typing
export interface TypingUpdate {
  room_id: number;
  user_id: string;
  username?: string;
  action: "start" | "stop";
}

// Offline queue items
export interface OfflineQueueItem {
  id: string;                     // uuid
  createdAt: number;              // ms since epoch
  attempts: number;
  event: "message" | "send_offer" | "respond_to_offer";
  payload: Record<string, any>;   // socket payload
  // optional ack correlation
  client_id?: string;
}
