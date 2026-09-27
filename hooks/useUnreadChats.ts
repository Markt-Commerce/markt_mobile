import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import { getRooms } from "../services/sections/chat";
import { onBadgeChanged } from "../utils/badgeEvents";

/**
 * How many conversations have something unread in them.
 *
 * Orders carries a badge for what is in the cart, and Chat carried nothing
 * — so a message that arrived while you were anywhere else in the app was
 * invisible until you happened to open the tab. The one place the app most
 * wants you to come back to was the one place that never asked.
 *
 * Counts conversations rather than messages, deliberately. "4" next to Chat
 * meaning four people are waiting is a number you can act on; the same 4
 * meaning one person sent four lines is not, and the two are
 * indistinguishable once they are on the badge.
 *
 * Refreshed the same way the cart badge is — on the shared badge event, and
 * when the app comes back to the foreground — so it does not need its own
 * polling.
 */
export function useUnreadChats(): { unreadRooms: number; refresh: () => Promise<void> } {
  const [unreadRooms, setUnreadRooms] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await getRooms(1, 50);
      const rooms = res?.rooms ?? [];
      setUnreadRooms(rooms.filter((room) => (room.unread_count ?? 0) > 0).length);
    } catch {
      // Leave the last known count alone. A failed refresh should not clear
      // a badge that is telling the truth.
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => onBadgeChanged(refresh), [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return { unreadRooms, refresh };
}
