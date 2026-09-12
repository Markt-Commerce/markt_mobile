import { useCallback, useEffect, useRef, useState } from "react";
import { getSpendableDiscounts } from "../services/sections/chat";
import { discountAmountFor } from "../models/chat";
import type { SpendableDiscount } from "../models/chat";
import type { CartGroup } from "../models/cart";
import logger from "../utils/logger";

/**
 * The chat offer worth the most on each shop's card in the basket.
 *
 * A seller can offer a discount in chat, and until now accepting one changed
 * nothing at checkout — the buyer paid full price for a deal they had been
 * given. The offers live in chat rooms and the basket is grouped by shop, so
 * the server tags each one with its seller account id and this picks, per
 * shop, the one that takes the most off *that* group's subtotal.
 *
 * "The most off" and not "the newest": a percentage offer beats a fixed one
 * on a big basket and loses on a small one, and the buyer should not have to
 * work that out. Offers whose minimum order the group does not reach score
 * zero and are ignored, so a shop with only an out-of-reach offer shows
 * nothing rather than an offer that would be refused.
 */
/**
 * What an offer is actually computed on, for this shop's card.
 *
 * An offer made from a product message covers that product only — the server
 * charges it against that product's lines, so showing it against the whole
 * group would promise a bigger reduction than the buyer gets. A shop-wide
 * offer keeps the whole subtotal.
 */
export function eligibleBase(
  discount: SpendableDiscount,
  group: CartGroup
): number {
  if (!discount.product_id) return group.subtotal;
  return (group.items ?? [])
    .filter((item) => item.product_id === discount.product_id)
    .reduce(
      (sum, item) => sum + (Number(item.product_price) || 0) * (item.quantity || 0),
      0
    );
}

export function useSpendableDiscounts(groups: CartGroup[]): {
  byGroup: Record<number, SpendableDiscount>;
  refresh: () => void;
} {
  const [offers, setOffers] = useState<SpendableDiscount[]>([]);
  const passId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++passId.current;
    try {
      const list = await getSpendableDiscounts();
      if (id === passId.current) setOffers(list);
    } catch (e) {
      // A basket that cannot show an offer is still a basket worth paying
      // for. Never block checkout on this.
      logger.warn("spendable discounts unavailable", e);
      if (id === passId.current) setOffers([]);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const byGroup: Record<number, SpendableDiscount> = {};
  for (const group of groups) {
    if (group.seller_id == null) continue;
    let best: SpendableDiscount | null = null;
    let bestAmount = 0;
    for (const offer of offers) {
      if (offer.seller_id !== group.seller_id) continue;
      const amount = discountAmountFor(offer, eligibleBase(offer, group));
      if (amount > bestAmount) {
        best = offer;
        bestAmount = amount;
      }
    }
    if (best) byGroup[group.seller_id] = best;
  }

  return { byGroup, refresh };
}
