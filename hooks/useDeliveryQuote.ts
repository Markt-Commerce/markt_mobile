import { useCallback, useEffect, useRef, useState } from "react";
import {
  createDeliveryQuote,
  describeNotServiceable,
  notServiceableReason,
} from "../services/sections/delivery";
import type { DeliveryQuote } from "../models/delivery";
import type { Cart } from "../models/cart";
import type { ShippingAddressPayload } from "../models/cart";
import logger from "../utils/logger";

interface Blocked {
  title: string;
  message: string;
  actionable: boolean;
}

/**
 * Keeps a live delivery quote for the current basket and address.
 *
 * A quote is a price we have committed to for fifteen minutes, so this
 * re-quotes whenever the thing being priced changes — the address, the shop,
 * or how many items are going. It deliberately does *not* re-quote on a timer:
 * a fee that changes while someone is looking at it is worse than one that has
 * expired by the time they pay, and the server honours an expired quote once
 * the money is taken.
 *
 * `blocked` is the case worth caring about. The old flat fee always produced a
 * number, so "we don't deliver there" could not be expressed at all; now it
 * can, and it has to stop checkout rather than let someone pay for a delivery
 * that will not happen.
 */
export function useDeliveryQuote(
  cart: Cart | null,
  address: ShippingAddressPayload | null | undefined,
  /**
   * Where the coordinates came from. "geolocation" means the device fixed
   * the position and the buyer accepted it, which the server records as a
   * confirmed dropoff; a saved or typed address is an approximation of
   * wherever they said they live, and the difference matters to a rider
   * looking for a door.
   */
  source?: "saved" | "geolocation" | "manual" | null
) {
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState<Blocked | null>(null);

  // Only the newest request may write state: addresses change faster than
  // the network answers, and a stale reply must not overwrite a fresh price.
  const requestId = useRef(0);

  const sellerIds = Array.from(
    new Set((cart?.items ?? []).map((i) => i.product?.seller_id).filter(Boolean))
  ) as number[];
  const itemCount = (cart?.items ?? []).reduce(
    (n, i) => n + (i.quantity ?? 0),
    0
  );
  const lat = address?.latitude;
  const lng = address?.longitude;

  // Primitives, so the effect re-runs when the values change rather than
  // whenever the objects are rebuilt.
  const sellerKey = sellerIds.join(",");

  const fetchQuote = useCallback(async () => {
    const id = ++requestId.current;

    if (!sellerIds.length || lat == null || lng == null) {
      setQuote(null);
      setBlocked(null);
      setLoading(false);
      return;
    }

    // One quote prices one shop to one address. The server refuses a
    // multi-market basket outright, so say so here rather than sending a
    // request we know will fail.
    if (sellerIds.length > 1) {
      setQuote(null);
      setBlocked({
        title: "One shop at a time for now",
        message:
          "This basket has items from more than one shop, which we can't price as a single delivery yet. Please check out from one shop at a time.",
        actionable: false,
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const q = await createDeliveryQuote({
        seller_id: sellerIds[0],
        dropoff_latitude: lat,
        dropoff_longitude: lng,
        item_count: itemCount || 1,
        precision: source === "geolocation" ? "confirmed" : "approximate",
      });
      if (id !== requestId.current) return;
      setQuote(q);
      setBlocked(null);
    } catch (error) {
      if (id !== requestId.current) return;
      const reason = notServiceableReason(error);
      if (reason) {
        setQuote(null);
        setBlocked(describeNotServiceable(reason));
      } else {
        // Not a refusal — the network, or us. Checkout is not blocked: the
        // server falls back to its flat estimate when no quote is sent, and
        // refusing to sell because our own quoting is down would be worse.
        logger.error("Delivery quote failed:", error);
        setQuote(null);
        setBlocked(null);
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [sellerKey, lat, lng, itemCount, source]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  return { quote, loading, blocked, refresh: fetchQuote };
}
