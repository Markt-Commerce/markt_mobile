import { useCallback, useEffect, useState } from "react";
import { checkServiceable } from "../services/sections/delivery";
import logger from "../utils/logger";

interface Result {
  /** null while unknown — treat as "don't block yet" rather than "blocked". */
  serviceable: boolean | null;
  city: string | null;
  checking: boolean;
}

/**
 * Whether Markt currently delivers from a shop's area.
 *
 * Used to stop a buyer filling a basket they can never check out. Markt is
 * not only a delivery app -- it has feeds, posts and niches -- so an
 * out-of-area shop stays browsable and only the cart action is gated. Hiding
 * the shop entirely would gut the social half and make a new city look like
 * a dead app.
 *
 * Unknown is not blocked. If the check fails or has not returned, the buyer
 * is let through and the server refuses at checkout with a specific reason.
 * Blocking on a failed network call would stop sales for a problem that is
 * ours.
 */
export function useShopServiceable(
  latitude?: number | null,
  longitude?: number | null
): Result {
  const [serviceable, setServiceable] = useState<boolean | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    if (latitude == null || longitude == null) {
      // A shop that never pinned itself cannot be delivered from, but that
      // is the seller's problem to fix, not something to hide from buyers.
      setServiceable(null);
      return;
    }
    setChecking(true);
    try {
      const result = await checkServiceable(latitude, longitude);
      setServiceable(result.serviceable);
      setCity(result.city);
    } catch (error) {
      logger.error("Serviceability check failed:", error);
      setServiceable(null);
    } finally {
      setChecking(false);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    check();
  }, [check]);

  return { serviceable, city, checking };
}
