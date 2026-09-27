import { useCallback, useEffect, useRef, useState } from "react";
import {
  createDeliveryQuote,
  describeNotServiceable,
  notServiceableMessage,
  notServiceableReason,
} from "../services/sections/delivery";
import type { DeliveryQuote } from "../models/delivery";
import type { CartGroup } from "../models/cart";
import type { SavedAddress } from "../models/addresses";
import logger from "../utils/logger";

export interface GroupQuote {
  quote: DeliveryQuote | null;
  blocked: { title: string; message: string; actionable: boolean } | null;
  loading: boolean;
}

/**
 * A delivery quote per shop, keyed by seller.
 *
 * One quote for the whole cart was meaningless the moment the basket was
 * split: a quote prices one pickup to one dropoff, so two shops need two.
 * Worse, the single cart-wide quote was refused outright for a multi-shop
 * basket, and the card was then shown with no blocked state at all — so
 * every Checkout button was enabled regardless of whether we could deliver,
 * and the failure only surfaced as a server error on tap.
 */
export function useGroupQuotes(
  groups: CartGroup[],
  address: SavedAddress | null
): Record<number, GroupQuote> {
  const [quotes, setQuotes] = useState<Record<number, GroupQuote>>({});
  // Addresses and baskets change faster than the network answers; only the
  // newest pass may write.
  const passId = useRef(0);

  const sellerKey = groups
    .map((g) => `${g.seller_id}:${g.item_count}`)
    .join(",");

  const refresh = useCallback(async () => {
    const id = ++passId.current;
    if (!address || groups.length === 0) {
      setQuotes({});
      return;
    }

    setQuotes((prev) => {
      const next: Record<number, GroupQuote> = {};
      for (const g of groups) {
        if (g.seller_id == null) continue;
        next[g.seller_id] = {
          quote: prev[g.seller_id]?.quote ?? null,
          blocked: null,
          loading: true,
        };
      }
      return next;
    });

    await Promise.all(
      groups.map(async (g) => {
        if (g.seller_id == null) return;
        try {
          const quote = await createDeliveryQuote({
            seller_id: g.seller_id,
            dropoff_latitude: address.latitude,
            dropoff_longitude: address.longitude,
            item_count: g.item_count,
          });
          if (id !== passId.current) return;
          setQuotes((prev) => ({
            ...prev,
            [g.seller_id!]: { quote, blocked: null, loading: false },
          }));
        } catch (error) {
          if (id !== passId.current) return;
          const reason = notServiceableReason(error);
          setQuotes((prev) => ({
            ...prev,
            [g.seller_id!]: {
              quote: null,
              // Only a serviceability refusal blocks. A network failure is
              // ours, and the server falls back to a flat estimate when no
              // quote id is sent, so it must not stop the sale.
              blocked: reason
                ? describeNotServiceable(reason, notServiceableMessage(error))
                : null,
              loading: false,
            },
          }));
          if (!reason) logger.error("Group quote failed:", error);
        }
      })
    );
  }, [sellerKey, address?.id, address?.latitude, address?.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refresh();
  }, [refresh]);

  return quotes;
}
