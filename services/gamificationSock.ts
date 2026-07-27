/**
 * Gamification realtime client. Reuses the existing Socket.IO /notification
 * namespace (spec §5.6/§6.5). On connect the client emits `register` with its
 * user id so the server joins it to the `user_{id}` room that gamification
 * events target.
 */
import { io, Socket } from "socket.io-client";
import { SOCKET_BASE_URL } from "./config";
import { getAuthToken } from "./authStorage";
import logger from "../utils/logger";
import type {
  PointsAwardedEvent,
  BadgeEarnedEvent,
  TierChangedEvent,
} from "../types/gamification";

const NAMESPACE_URL = `${SOCKET_BASE_URL}/notification`;

type Listener<T> = (data: T) => void;

class GamificationSocket {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private pointsListeners = new Set<Listener<PointsAwardedEvent>>();
  private badgeListeners = new Set<Listener<BadgeEarnedEvent>>();
  private tierListeners = new Set<Listener<TierChangedEvent>>();

  async connect(userId: string) {
    this.userId = userId;
    if (this.socket) {
      this.register();
      return;
    }
    const token = await getAuthToken();
    this.socket = io(NAMESPACE_URL, {
      transports: ["websocket", "polling"],
      auth: token ? { token } : undefined,
      extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
    });

    this.socket.on("connect", () => this.register());
    this.socket.on("gamification:points_awarded", (d: PointsAwardedEvent) =>
      this.pointsListeners.forEach((fn) => fn(d))
    );
    this.socket.on("gamification:badge_earned", (d: BadgeEarnedEvent) =>
      this.badgeListeners.forEach((fn) => fn(d))
    );
    this.socket.on("gamification:tier_changed", (d: TierChangedEvent) =>
      this.tierListeners.forEach((fn) => fn(d))
    );
    this.socket.on("connect_error", (e) =>
      logger.error("gamification socket connect_error:", e?.message ?? e)
    );
  }

  private register() {
    if (this.socket && this.userId) {
      this.socket.emit("register", { user_id: this.userId });
    }
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.userId = null;
  }

  onPoints(cb: Listener<PointsAwardedEvent>) {
    this.pointsListeners.add(cb);
    return () => this.pointsListeners.delete(cb);
  }
  onBadge(cb: Listener<BadgeEarnedEvent>) {
    this.badgeListeners.add(cb);
    return () => this.badgeListeners.delete(cb);
  }
  onTier(cb: Listener<TierChangedEvent>) {
    this.tierListeners.add(cb);
    return () => this.tierListeners.delete(cb);
  }
}

const gamificationSocket = new GamificationSocket();
export default gamificationSocket;
