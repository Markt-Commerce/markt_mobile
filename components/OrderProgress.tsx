import React from "react";
import { View, Text } from "react-native";
import { Check, CreditCard, Home, Package, Truck } from "lucide-react-native";
import { useTokens } from "../theme/useTokens";
import { formatStatus } from "../utils/formatStatus";

/**
 * Where an order has got to, drawn as a journey.
 *
 * The previous version was four flat bars with labels underneath. Bars are
 * fine for "how far along", but an order isn't a percentage — each step is a
 * distinct thing that either happened or hasn't, and the buyer's real question
 * is which one is happening *now*. Discs carry that: a completed step is
 * ticked and closed, the current one is ringed and holds its own icon, and the
 * ones ahead are outlines. State is encoded in shape as well as colour, so it
 * survives being read quickly or by someone who can't separate the hues.
 *
 * Green for done and the brand orange for "you are here" is deliberate: it
 * keeps two different questions ("is this finished?" / "what's happening?")
 * on two different channels.
 */

type StepKey = "paid" | "processing" | "shipped" | "delivered";

const STEPS: { key: StepKey; label: string; Icon: React.ElementType }[] = [
  { key: "paid", label: "Paid", Icon: CreditCard },
  { key: "processing", label: "Processing", Icon: Package },
  { key: "shipped", label: "Shipped", Icon: Truck },
  { key: "delivered", label: "Delivered", Icon: Home },
];

/**
 * Which step is happening *now*. Everything before it is done.
 *
 * The old version tracked only "how many bars to fill", which was enough when
 * every filled bar looked the same. This design separates finished from
 * in-progress, so the mapping has to name the active step rather than count.
 * 4 means the journey is over and all four are ticked.
 */
const CURRENT_STEP: Record<string, number> = {
  pending_payment: 0,
  pending: 0,
  paid: 1,
  processing: 1,
  // Packed but not collected: past the seller, not yet with the courier. It
  // sits on Shipped as the active step because that is what happens next.
  ready_for_delivery: 2,
  shipped: 2,
  in_transit: 2,
  delivered: 4,
  completed: 4,
};

const TERMINAL = ["cancelled", "refunded", "returned", "failed"];

/**
 * What happens next, in the buyer's terms.
 *
 * Explanatory copy derived from the status we already have — not invented
 * facts. Anything the app doesn't actually know (a courier name, an ETA) is
 * deliberately absent rather than guessed at.
 */
const NEXT_UP: Record<string, string> = {
  pending_payment: "Waiting for payment to confirm",
  pending: "Waiting for payment to confirm",
  paid: "The seller is getting your order ready",
  processing: "The seller is getting your order ready",
  ready_for_delivery: "Packed and waiting to be picked up",
  shipped: "On its way to you",
  in_transit: "On its way to you",
  delivered: "Delivered — thanks for shopping with Markt",
  completed: "Delivered — thanks for shopping with Markt",
};

const DISC = 34;

export default function OrderProgress({
  status,
  hint,
}: {
  status?: string;
  /** Overrides the derived line when the caller knows something better. */
  hint?: string;
}) {
  const t = useTokens();
  const key = String(status ?? "").toLowerCase();

  if (TERMINAL.includes(key)) {
    return (
      <View className="rounded-2xl p-4 mb-3 bg-danger-muted">
        <Text className="text-danger-text text-[11px] font-bold uppercase tracking-[1.5px]">
          Status
        </Text>
        <Text className="text-danger-text text-[20px] font-bold mt-1">
          {formatStatus(status)}
        </Text>
      </View>
    );
  }

  const current = CURRENT_STEP[key] ?? 1;
  const subtitle = hint ?? NEXT_UP[key];

  return (
    <View className="rounded-2xl border border-border bg-surface-raised p-4 mb-3">
      <Text className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">
        Status
      </Text>
      <Text className="text-[22px] font-bold mt-1 text-text-primary">
        {formatStatus(status)}
      </Text>
      {subtitle ? (
        <Text className="text-[13px] mt-1 text-text-secondary">{subtitle}</Text>
      ) : null}

      <View
        className="flex-row items-start mt-4"
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: STEPS.length, now: current }}
        accessibilityLabel={`Step ${Math.min(current + 1, STEPS.length)} of ${STEPS.length}: ${
          STEPS[Math.min(current, STEPS.length - 1)].label
        }`}
      >
        {STEPS.map((step, i) => {
          const done = i < current;
          const isCurrent = i === current;
          const Icon = step.Icon;

          return (
            <React.Fragment key={step.key}>
              <View className="items-center" style={{ width: DISC + 34 }}>
                <View
                  className="items-center justify-center rounded-full"
                  style={{
                    width: DISC,
                    height: DISC,
                    backgroundColor: done
                      ? t.successFill
                      : isCurrent
                        ? t.primaryMuted
                        : "transparent",
                    borderWidth: done ? 0 : 2,
                    borderColor: isCurrent ? t.primary : t.border,
                  }}
                >
                  {done ? (
                    <Check size={17} color={t.onSuccessFill} strokeWidth={3} />
                  ) : (
                    <Icon
                      size={16}
                      color={isCurrent ? t.primaryText : t.textMuted}
                      strokeWidth={isCurrent ? 2.4 : 1.8}
                    />
                  )}
                </View>
                <Text
                  className={`text-[11px] mt-1.5 text-center ${
                    isCurrent
                      ? "font-bold text-primary-text"
                      : done
                        ? "text-text-primary"
                        : "text-text-muted"
                  }`}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
              </View>

              {i < STEPS.length - 1 ? (
                <View
                  className="flex-1 rounded-full"
                  style={{
                    height: 2,
                    marginTop: DISC / 2 - 1,
                    backgroundColor: i < current - 1 ? t.successFill : t.border,
                  }}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}
