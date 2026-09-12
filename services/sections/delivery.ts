import { request, BASE_URL } from "../api";
import type {
  CombinedDeliveryQuote,
  DeliveryQuote,
  DeliveryQuoteRequest,
  NotServiceableError,
  NotServiceableReason,
  ServiceabilityResult,
} from "../../models/delivery";

/**
 * Whether we deliver to a point at all.
 *
 * Unauthenticated on the server on purpose, so this can be asked before
 * anyone signs up.
 */
export async function checkServiceable(
  latitude: number,
  longitude: number
): Promise<ServiceabilityResult> {
  return request<ServiceabilityResult>(
    `${BASE_URL}/delivery/serviceable?latitude=${latitude}&longitude=${longitude}`,
    { method: "GET" }
  );
}

/** Price a delivery from one shop to a point. */
export async function createDeliveryQuote(
  data: DeliveryQuoteRequest
): Promise<DeliveryQuote> {
  return request<DeliveryQuote>(`${BASE_URL}/delivery/quote`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Pull the structured reason out of a 422.
 *
 * The server raises rather than aborts precisely so this survives: the
 * message alone cannot tell "your address is outside our area" from "this
 * shop hasn't set its location", and those need different things from the
 * buyer. Returns null for anything that isn't a serviceability refusal.
 */
export function notServiceableReason(error: unknown): NotServiceableReason | null {
  const body = (error as { body?: NotServiceableError })?.body;
  if (body?.error_type === "not_serviceable" && body.reason) return body.reason;
  return null;
}

/** The server's own sentence for a refusal, when it has a specific one. */
export function notServiceableMessage(error: unknown): string | null {
  const body = (error as { body?: NotServiceableError })?.body;
  return body?.error_type === "not_serviceable" ? (body.message ?? null) : null;
}

/** What to tell the buyer, and whether they can do anything about it. */
export function describeNotServiceable(
  reason: NotServiceableReason,
  /** The server's own sentence, when it has a more specific one. */
  detail?: string | null
): {
  title: string;
  message: string;
  actionable: boolean;
} {
  switch (reason) {
    case "dropoff_unlocated":
      return {
        title: "We need your location",
        message:
          "Set your delivery address on the map so we can work out the fee.",
        actionable: true,
      };
    case "pickup_unlocated":
      return {
        title: "This shop has no location yet",
        message:
          "The seller hasn't pinned their shop, so we can't arrange delivery from it. Try messaging them.",
        actionable: false,
      };
    case "dropoff_not_serviceable":
      return {
        title: "We don't reach you yet",
        message:
          "We're not delivering to this address yet. We're adding new areas — we can let you know when we reach yours.",
        actionable: false,
      };
    case "pickup_not_serviceable":
      return {
        title: "We don't cover this shop's area yet",
        message:
          "We're not delivering from this shop's area yet. We're adding new areas all the time.",
        actionable: false,
      };
    case "no_lane":
      return {
        title: "Not between these two places yet",
        // The server names the cities when they differ, because "we deliver
        // in both of these areas but not between them" reads like a bug to
        // someone who can see both are served. Fall back to the generic line
        // for two zones inside one city that simply have no lane.
        message:
          detail ||
          "We deliver in both of these areas, but not between them yet. We're working on it.",
        actionable: false,
      };
  }
}

/** What one rider collecting from several shops would cost.
 * Answers 200 with available:false and a reason when it isn't possible —
 * not being able to share a delivery is an ordinary answer, not an error. */
export async function getCombinedQuote(data: {
  seller_ids: number[];
  dropoff_latitude: number;
  dropoff_longitude: number;
}): Promise<CombinedDeliveryQuote> {
  return request<CombinedDeliveryQuote>(`${BASE_URL}/delivery/quote/combined`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
