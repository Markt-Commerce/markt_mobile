import React from "react";
import { View, Text } from "react-native";
import { AlertTriangle, Check, Truck } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import type { DeliveryState, OrderDelivery } from "../../models/orders";

/**
 * The happy path, in the order a parcel actually travels.
 *
 * Deliberately not every state the backend has. `quoted` is before payment
 * and the buyer is not looking at this yet; `awaiting_dispatch` means a
 * courier could not be found, which is our problem to fix rather than a step
 * to show someone as progress; and failed/cancelled are endings, handled
 * separately below.
 */
const STEPS: { state: DeliveryState; label: string; hint: string }[] = [
  { state: "paid", label: "Paid", hint: "We're finding a rider." },
  { state: "job_created", label: "Rider requested", hint: "Waiting for someone to take it." },
  { state: "assigned", label: "Rider assigned", hint: "On the way to the shop." },
  { state: "picked_up", label: "Picked up", hint: "Your parcel is with the rider." },
  { state: "in_transit", label: "On the way", hint: "Heading to your address." },
  { state: "delivered", label: "Delivered", hint: "Handed over." },
];

/** How far along a state is. */
function progressIndex(state: DeliveryState): number {
  // awaiting_dispatch sits between paid and a rider being found: the money is
  // in and nobody has taken the job yet.
  if (state === "awaiting_dispatch") return 0;
  return STEPS.findIndex((s) => s.state === state);
}

export default function DeliveryProgress({ delivery }: { delivery: OrderDelivery }) {
  const t = useTokens();

  if (delivery.state === "cancelled") {
    return (
      <View className="rounded-xl bg-surface-sunken p-4">
        <Text className="text-[15px] font-bold text-text-primary">
          Delivery cancelled
        </Text>
        <Text className="mt-1 text-[13px] text-text-secondary">
          This delivery won't be going ahead.
        </Text>
      </View>
    );
  }

  if (delivery.state === "failed") {
    return (
      <View className="rounded-xl border border-warning bg-surface-sunken p-4">
        <View className="flex-row items-center gap-2">
          <AlertTriangle size={18} color={t.warningText} />
          <Text className="flex-1 text-[15px] font-bold text-text-primary">
            Delivery didn't succeed
          </Text>
        </View>
        <Text className="mt-2 text-[13px] leading-5 text-text-secondary">
          {/* The courier's own words when we have them: "nobody at the
              address" is worth more than a generic apology. */}
          {delivery.failure_reason ||
            "The rider couldn't complete this delivery. We're sorting it out."}
        </Text>
      </View>
    );
  }

  const current = progressIndex(delivery.state);
  const stalled = delivery.state === "awaiting_dispatch";

  return (
    <View className="rounded-xl bg-surface-sunken p-4">
      <View className="mb-3 flex-row items-center">
        <Truck size={18} color={t.textSecondary} />
        <Text className="ml-2 flex-1 text-[15px] font-bold text-text-primary">
          Delivery
        </Text>
        {delivery.fee != null ? (
          <Text className="text-[13px] text-text-secondary">
            {`₦${delivery.fee.toFixed(2)}`}
            {delivery.settled === false && delivery.batch_opt_in ? "*" : ""}
          </Text>
        ) : null}
      </View>

      {stalled ? (
        <Text className="mb-3 text-[13px] leading-5 text-text-secondary">
          We're still finding a rider for this one. You don't need to do
          anything — we'll keep trying.
        </Text>
      ) : null}

      {STEPS.map((step, i) => {
        const done = current >= i;
        const isCurrent = current === i;
        return (
          <View key={step.state} className="flex-row">
            {/* The rail: a dot per step, joined by a line that only fills in
                as far as the parcel has actually got. */}
            <View className="items-center" style={{ width: 24 }}>
              <View
                className={`h-4 w-4 items-center justify-center rounded-full ${
                  done ? "bg-primary-fill" : "bg-surface-raised"
                }`}
              >
                {done ? <Check size={10} color={t.textOnPrimary} /> : null}
              </View>
              {i < STEPS.length - 1 ? (
                <View
                  className={`w-0.5 flex-1 ${
                    current > i ? "bg-primary-fill" : "bg-surface-raised"
                  }`}
                  style={{ minHeight: 18 }}
                />
              ) : null}
            </View>
            <View className="flex-1 pb-3 pl-3">
              <Text
                className={`text-[14px] ${
                  isCurrent
                    ? "font-bold text-text-primary"
                    : done
                      ? "text-text-primary"
                      : "text-text-muted"
                }`}
              >
                {step.label}
              </Text>
              {isCurrent ? (
                <Text className="mt-0.5 text-[12px] text-text-secondary">
                  {step.hint}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}

      {delivery.settled === false && delivery.batch_opt_in ? (
        <Text className="mt-1 text-[11px] text-text-muted">
          * Shared delivery — the final amount is confirmed once the run
          closes, and can only be lower.
        </Text>
      ) : null}
    </View>
  );
}
