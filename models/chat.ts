// /models/chat.ts
export type MessageType =
  | "text"
  | "image"
  | "video"
  | "product"
  /** A buyer naming their own price. */
  | "offer"
  /** A seller offering the buyer a discount. Sent by the server since
   *  the feature existed; the app had no branch for it, so these
   *  rendered as empty bubbles. */
  | "discount";

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

export interface MessageReactionSummary {
  reaction_type: string;
  count: number;
  has_reacted: boolean;
}

export interface ChatMessage {
  id: number | string;
  room_id: number;
  sender_id: string;
  content: string;
  message_type: MessageType;
  message_data?: (Record<string, any> & {
    /** Reaction summaries from GET /chats/messages/:id/reactions (CHAT_MESSAGE_REACTIONS_API) */
    reactions?: MessageReactionSummary[];
    /** Legacy: total count (fallback when reactions array absent) */
    reactions_count?: number;
  }) | null;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
  // client-only
  client_id?: string;
  pending?: boolean;
  error?: string | null;
  sender_username?: string;
  sender?: {
    id?: string;
    username?: string | null;
    profile_picture?: string | null;
    profile_picture_url?: string | null;
  };
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
      profile_picture_url?: string;
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
    profile_picture_url?: string;
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


/** An offer a seller made in chat that this buyer can still spend.
 *
 * `seller_id` is the seller *account* id, which is what the cart groups by --
 * the offer itself records the seller's user id, and the server joins the two
 * so the app never has to guess which shop card an offer belongs to. */
export interface SpendableDiscount {
  id: number;
  seller_id: number;
  room_id: number | null;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  minimum_order_amount: number | null;
  maximum_discount_amount: number | null;
  expires_at: string;
  discount_message: string | null;
  product_id: string | null;
}

/** What an offer takes off a given subtotal, mirroring the server's rules so
 * the buyer sees the same number before they commit. The server decides for
 * real at checkout; this only decides what to show. */
export function discountAmountFor(
  discount: SpendableDiscount,
  subtotal: number
): number {
  if (discount.minimum_order_amount && subtotal < discount.minimum_order_amount) {
    return 0;
  }
  let amount =
    discount.discount_type === "percentage"
      ? (subtotal * discount.discount_value) / 100
      : discount.discount_value;
  if (discount.maximum_discount_amount != null) {
    amount = Math.min(amount, discount.maximum_discount_amount);
  }
  // Never more than the basket: a fixed offer larger than what is being
  // bought would otherwise show a negative total.
  return Math.min(amount, subtotal);
}
