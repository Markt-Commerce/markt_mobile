import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ChatMessage,
  MessageType,
  OfferPayload,
  OfferResponsePayload,
  OfflineQueueItem,
  TypingUpdate,
} from "../models/chat";
import { BASE_URL } from "./api";

const CHAT_NAMESPACE = "/chat";
const SOCKET_URL = "https://test.api.marktcommerce.com/api/v1/chat";

// STORAGE & QUEUE
const OFFLINE_QUEUE_KEY = "markt.chat.offlineQueue";
const MESSAGE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const MAX_ATTEMPTS = 6;                    // ~exponential retry
const TYPING_DEBOUNCE_MS = 2500;

// small util
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const now = () => Date.now();
const uuid = () => `${now()}-${Math.random().toString(36).slice(2)}`;

type Listener<T> = (data: T) => void;

class ChatSocket {
  private socket: Socket | null = null;
  private connected = false;

  // listeners
  private messageListeners = new Set<Listener<ChatMessage>>();
  private offerSentListeners = new Set<Listener<any>>();
  private offerConfirmedListeners = new Set<Listener<any>>();
  private offerResponseListeners = new Set<Listener<any>>();
  private typingListeners = new Set<Listener<TypingUpdate>>();
  private statusListeners = new Set<Listener<"connected" | "disconnected">>();

  // typing throttle per room
  private typingGuards = new Map<number, number>();

  // ===== Connection =====
  connect() {
    if (this.socket) return;

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,          // session cookie auth
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      ackTimeout: 8000,               // socket.io v4 option (if available)
      autoConnect: true,
      path: "/socket.io",
    });

    // server says hello
    this.socket.on("connected", () => {
      this.connected = true;
      this.emitStatus("connected");
      this.flushQueue();              // attempt to deliver any queued messages
    });

    this.socket.on("connect", () => {
      this.connected = true;
      this.emitStatus("connected");
      this.flushQueue();
    });

    this.socket.on("disconnect", () => {
      this.connected = false;
      this.emitStatus("disconnected");
    });

    // ===== Core events =====
    this.socket.on("message", (data: ChatMessage) => {
      this.messageListeners.forEach(fn => fn(data));
      // if server echoes back client_id, drop matching queued item
      if ((data as any)?.client_id) this.dropQueuedByClientId((data as any).client_id);
    });

    this.socket.on("message_sent", (data: any) => {
      if (data?.client_id) this.dropQueuedByClientId(data.client_id);
    });

    // offers
    this.socket.on("offer_sent", (data: any) => {
      this.offerSentListeners.forEach(fn => fn(data));
      if (data?.client_id) this.dropQueuedByClientId(data.client_id);
    });
    this.socket.on("offer_confirmed", (data: any) => {
      this.offerConfirmedListeners.forEach(fn => fn(data));
    });
    this.socket.on("offer_response", (data: any) => {
      this.offerResponseListeners.forEach(fn => fn(data));
    });

    // typing
    this.socket.on("typing_update", (data: TypingUpdate) => {
      this.typingListeners.forEach(fn => fn(data));
    });

    // keep-alive
    this.socket.on("pong", () => {
      // no-op; could update lastPong timestamp
    });

    // errors
    this.socket.on("error", (e: any) => {
      console.warn("[chat] error:", e?.message ?? e);
    });
    this.socket.on("connect_error", (e: any) => {
      console.warn("[chat] connect_error:", e?.message ?? e);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.connected = false;
    this.emitStatus("disconnected");
  }

  // ===== Rooms =====
  joinRoom(room_id: number) {
    this.socket?.emit("join_room", { room_id });
  }

  leaveRoom(room_id: number) {
    this.socket?.emit("leave_room", { room_id });
  }

  // ===== Typing =====
  typingStart(room_id: number) {
    const last = this.typingGuards.get(room_id) ?? 0;
    if (now() - last < TYPING_DEBOUNCE_MS) return;
    this.typingGuards.set(room_id, now());
    this.socket?.emit("typing_start", { room_id });
  }

  typingStop(room_id: number) {
    this.socket?.emit("typing_stop", { room_id });
  }

  // ===== Messages =====
  /**
   * Send a text/media/product message via socket.
   * For media: pass `message_data` with { url, mime, width?, height?, duration? }
   * For product: pass `message_data` with { product_id }
   */
  async sendMessage(
    room_id: number,
    message_type: MessageType,
    content: string,
    message_data?: Record<string, any> | null
  ): Promise<string /*client_id*/> {
    const client_id = uuid();
    const payload = { room_id, message: content, message_type, message_data, client_id };

    if (this.connected) {
      // try with ack first, fallback to fire-and-forget
      await new Promise<void>((resolve) => {
        let resolved = false;
        try {
          this.socket?.timeout?.(8000).emit("message", payload, () => {
            resolved = true;
            resolve();
          });
        } catch {
          // older socket.io-client w/o timeout()
          this.socket?.emit("message", payload);
          // resolve soon; queue drop will be handled by 'message_sent' or 'message' echo
          resolved = true;
          resolve();
        }
        // safety after 9s
        setTimeout(() => { if (!resolved) resolve(); }, 9000);
      });
    } else {
      await this.queue({ event: "message", payload, client_id });
    }
    return client_id;
  }

  // convenience wrappers
  sendText(room_id: number, text: string) {
    // server validation caps are 1–1000; we trim client-side to be safe
    const trimmed = (text ?? "").slice(0, 1000);
    return this.sendMessage(room_id, "text", trimmed, null);
  }

  sendImage(room_id: number, url: string, mime = "image/jpeg", meta?: Record<string, any>) {
    if (!/^image\//.test(mime)) throw new Error("Invalid image mime");
    return this.sendMessage(room_id, "image", url, { url, mime, ...meta });
  }

  sendVideo(room_id: number, url: string, mime = "video/mp4", meta?: Record<string, any>) {
    if (!/^video\//.test(mime)) throw new Error("Invalid video mime");
    return this.sendMessage(room_id, "video", url, { url, mime, ...meta });
  }

  sendProduct(room_id: number, product_id: string, note?: string) {
    return this.sendMessage(room_id, "product", note ?? "", { product_id });
  }

  // ===== Offers =====
  async sendOffer(data: OfferPayload): Promise<string /*client_id*/> {
    const client_id = uuid();
    const payload = { ...data, client_id };
    if (this.connected) {
      this.socket?.emit("send_offer", payload);
    } else {
      await this.queue({ event: "send_offer", payload, client_id });
    }
    return client_id;
  }

  async respondToOffer(data: OfferResponsePayload): Promise<void> {
    const payload = { ...data };
    if (this.connected) {
      this.socket?.emit("respond_to_offer", payload);
    } else {
      await this.queue({ event: "respond_to_offer", payload });
    }
  }

  // ===== Keepalive =====
  ping() {
    this.socket?.emit("ping", {});
  }

  // ===== Subscriptions =====
  onMessage(cb: Listener<ChatMessage>) { this.messageListeners.add(cb); return () => this.messageListeners.delete(cb); }
  onOfferSent(cb: Listener<any>) { this.offerSentListeners.add(cb); return () => this.offerSentListeners.delete(cb); }
  onOfferConfirmed(cb: Listener<any>) { this.offerConfirmedListeners.add(cb); return () => this.offerConfirmedListeners.delete(cb); }
  onOfferResponse(cb: Listener<any>) { this.offerResponseListeners.add(cb); return () => this.offerResponseListeners.delete(cb); }
  onTyping(cb: Listener<TypingUpdate>) { this.typingListeners.add(cb); return () => this.typingListeners.delete(cb); }
  onStatus(cb: Listener<"connected" | "disconnected">) { this.statusListeners.add(cb); return () => this.statusListeners.delete(cb); }

  private emitStatus(s: "connected" | "disconnected") {
    this.statusListeners.forEach(fn => fn(s));
  }

  // ===== Offline Queue =====
  private async queue(item: Omit<OfflineQueueItem, "id" | "createdAt" | "attempts">) {
    const entry: OfflineQueueItem = { id: uuid(), createdAt: now(), attempts: 0, ...item };
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const list: OfflineQueueItem[] = raw ? JSON.parse(raw) : [];
    list.push(entry);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(list));
  }

  private async dropQueuedByClientId(client_id: string) {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return;
    const list: OfflineQueueItem[] = JSON.parse(raw);
    const next = list.filter(it => it.client_id !== client_id);
    if (next.length !== list.length) {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(next));
    }
  }

  private async flushQueue() {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return;
    let list: OfflineQueueItem[] = JSON.parse(raw);

    // drop expired
    const fresh = list.filter(it => now() - it.createdAt < MESSAGE_TTL_MS && it.attempts < MAX_ATTEMPTS);

    for (let i = 0; i < fresh.length; i++) {
      const item = fresh[i];
      try {
        if (!this.connected) break;

        // exponential backoff between items by attempts
        if (item.attempts > 0) {
          const delay = Math.min(3000 * 2 ** (item.attempts - 1), 15000);
          await sleep(delay);
        }

        switch (item.event) {
          case "message":
            this.socket?.emit("message", item.payload);
            break;
          case "send_offer":
            this.socket?.emit("send_offer", item.payload);
            break;
          case "respond_to_offer":
            this.socket?.emit("respond_to_offer", item.payload);
            break;
        }

        // mark as attempted; keep until ack arrives (message_sent/offer_sent or message echo with client_id)
        item.attempts += 1;
      } catch (e) {
        item.attempts += 1;
      }
    }

    // persist updated attempts; we don’t remove until we see ack or TTL expires
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(fresh));
  }
}

const chatSocket = new ChatSocket();
export default chatSocket;
