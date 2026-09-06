/**
 * The unread count shown on the notification bell, shared app-wide.
 *
 * Mirrors hooks/cartContext.tsx: a badge has to survive navigating away from
 * the Alerts screen and update when something elsewhere marks a notification
 * read or a push arrives in the foreground, so it's app state, not screen
 * state. refreshUnread() re-reads the server count; bumpUnread() moves the
 * badge immediately (e.g. right after marking read) before that round-trip.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { getUnreadNotificationCount } from "../services/sections/notifications";
import { onNotificationsChanged } from "../utils/notificationEvents";
import { useUser } from "./userContextProvider";

export interface NotificationsContextType {
  /** Unread notification count for the bell badge. 0 when signed out. */
  unreadCount: number;
  /** Re-read the count from the server. */
  refreshUnread: () => Promise<void>;
  /** Move the badge immediately by a delta, ahead of the server round-trip. */
  bumpUnread: (delta: number) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(
  undefined,
);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await getUnreadNotificationCount();
      setUnreadCount(res?.count ?? 0);
    } catch {
      // A badge is not worth a toast. Leave the last known count in place
      // rather than flashing 0 on a dropped request.
    }
  }, [user]);

  const bumpUnread = useCallback((delta: number) => {
    setUnreadCount((current) => Math.max(0, current + delta));
  }, []);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  // Marking read (screen) and a foreground push arrival (NotificationsBootstrap)
  // both emit here, so neither has to know the badge exists.
  useEffect(() => onNotificationsChanged(refreshUnread), [refreshUnread]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, refreshUnread, bumpUnread }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotificationsBadge = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotificationsBadge must be used within a NotificationsProvider",
    );
  }
  return context;
};
