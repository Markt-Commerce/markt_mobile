import React from "react";
import { View, Text, Image, TouchableOpacity, Linking } from "react-native";
import { Bike, Phone, Star, User } from "lucide-react-native";

import { useTokens } from "../../theme/useTokens";
import type { TrackingDelivery } from "../../models/orders";

/**
 * Who is bringing it.
 *
 * The tracking screen described the delivery without naming the person
 * doing it -- one line reading "picked up" and nothing else. The rider
 * has had the buyer's name, address and phone number from the moment
 * they accepted; the buyer had no name, no face, and no way to reach the
 * one person about to knock on their door.
 */

/** What the rider is doing right now, in the buyer's words rather than
 *  the backend's. The raw values are ARRIVED_PICKUP, PICKED_UP and so
 *  on, and "delivered pending qr" on a lock screen means nothing. */
const STEP_LABEL: Record<string, string> = {
  ARRIVED_PICKUP: "At the shop, collecting your order",
  PICKED_UP: "Has your order",
  EN_ROUTE_TO_DROPOFF: "On the way to you",
  DELIVERED_PENDING_QR: "At your address — have your code ready",
  COMPLETED: "Delivered",
};

function stepLabel(delivery: TrackingDelivery): string {
  const step = delivery.logistical_status;
  // No step yet means accepted and not yet started: the rider is on
  // their way to the shop, which is a real thing to say and better than
  // echoing "ACCEPTED".
  if (!step) return "Heading to the shop";
  return STEP_LABEL[step] ?? step.replace(/_/g, " ").toLowerCase();
}

/** Bikes, cars and vans, not BIKE. */
function vehicleLabel(vehicle?: string | null): string | null {
  if (!vehicle) return null;
  const word = vehicle.toLowerCase();
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export default function RiderCard({ delivery }: { delivery: TrackingDelivery }) {
  const t = useTokens();
  const rider = delivery.rider;

  // Before a rider is found there is nobody to show. The step line is
  // still worth having, so this degrades to it rather than disappearing.
  const name = rider?.name?.trim();
  const vehicle = vehicleLabel(rider?.vehicle_type);

  return (
    <View className="rounded-xl bg-surface-sunken p-4">
      <View className="flex-row items-center gap-3">
        {rider?.profile_picture ? (
          <Image
            source={{ uri: rider.profile_picture }}
            className="h-12 w-12 rounded-full bg-surface-raised"
          />
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-raised">
            <User size={22} color={t.textSecondary} />
          </View>
        )}

        <View className="flex-1">
          <Text className="text-[15px] font-bold text-text-primary">
            {name || "Your rider"}
          </Text>
          <Text className="mt-0.5 text-[13px] text-text-secondary">
            {stepLabel(delivery)}
          </Text>

          {(vehicle || rider?.rating != null) && (
            <View className="mt-1.5 flex-row items-center gap-3">
              {!!vehicle && (
                <View className="flex-row items-center gap-1">
                  <Bike size={13} color={t.textSecondary} />
                  <Text className="text-[12px] text-text-secondary">{vehicle}</Text>
                </View>
              )}
              {rider?.rating != null && (
                <View className="flex-row items-center gap-1">
                  <Star size={13} color={t.textSecondary} />
                  <Text className="text-[12px] text-text-secondary">
                    {rider.rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Hidden rather than disabled when there is no number: a call
            button that does nothing is worse than none. The rider's app
            makes the same call on the same reasoning. */}
        {!!rider?.phone_number && (
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${rider.phone_number}`)}
            className="h-11 w-11 items-center justify-center rounded-full bg-primary"
            accessibilityRole="button"
            accessibilityLabel={`Call ${name || "your rider"}`}
          >
            <Phone size={18} color={t.textOnPrimary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
