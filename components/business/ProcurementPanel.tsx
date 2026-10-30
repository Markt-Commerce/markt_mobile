/**
 * The Markt Business part of a request screen.
 *
 * - Procurement details (quantity, delivery, date, specifications) when the
 *   request came from a business account.
 * - Offers: the owner sees all of them and can accept or decline pending
 *   ones; a seller sees their own, or a form to send one.
 *
 * Accepting an offer doesn't create an order — the two sides agree the
 * details in chat and the buyer orders through Markt.
 */
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import Button from "../button";
import { Badge, Term } from "./ui";
import { useTokens } from "../../theme/useTokens";
import { useToast } from "../ToastProvider";
import { useUser } from "../../hooks/userContextProvider";
import { useBusiness } from "../../hooks/businessContext";
import { createRequestOffer } from "../../services/sections/request";
import { acceptRequestOffer, rejectRequestOffer } from "../../services/sections/requests";
import { friendlyErrorMessage } from "../../utils/errorMessages";
import { formatNaira } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/datetime";
import { formatQuantity, optionLabel } from "../../models/business";
import type { Request, RequestOffer } from "../../models/request";

const OFFER_TONE: Record<string, "success" | "brand" | "muted"> = { PENDING: "brand", ACCEPTED: "success" };

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text className="text-[11px] font-bold tracking-[2px] uppercase text-text-secondary">{children}</Text>;
}

function OfferCard({
  offer,
  unitLabel,
  units,
  unit,
  actions,
}: {
  offer: RequestOffer;
  unitLabel: string;
  units: Parameters<typeof formatQuantity>[2];
  unit?: string | null;
  actions?: React.ReactNode;
}) {
  return (
    <View className="p-4 mb-3 rounded border border-border bg-surface-raised">
      <View className="flex-row items-center justify-between">
        <Text className="text-[15px] font-bold text-text-primary" numberOfLines={1}>
          {offer.seller?.shop_name ?? "Supplier"}
        </Text>
        <Text className="text-[16px] font-bold text-text-primary">{formatNaira(offer.price)}</Text>
      </View>
      {offer.proposed_quantity != null ? (
        <Text className="mt-1 text-[13px] text-text-secondary">
          Can supply {formatQuantity(offer.proposed_quantity, unit, units) || `${offer.proposed_quantity} ${unitLabel}`}
        </Text>
      ) : null}
      {offer.message ? <Text className="mt-2 text-[14px] leading-5 text-text-primary">{offer.message}</Text> : null}
      <View className="flex-row mt-3">
        <Badge label={String(offer.status).toLowerCase()} tone={OFFER_TONE[String(offer.status)] ?? "muted"} />
      </View>
      {actions}
    </View>
  );
}

export default function ProcurementPanel({
  request,
  isOwner,
  isOpen,
  onChanged,
}: {
  request: Request;
  isOwner: boolean;
  isOpen: boolean;
  onChanged: () => void;
}) {
  const t = useTokens();
  const { show } = useToast();
  const { profile } = useUser();
  const { config } = useBusiness();
  const units = config.units;
  const unitLabel = request.unit ? optionLabel(units, request.unit).toLowerCase() : "";
  const offers = (request.offers ?? []) as RequestOffer[];
  const sellerId = profile?.seller_account?.id;
  const myOffer = sellerId != null ? offers.find((o) => o.seller_id === sellerId) : undefined;
  // A procurement request is answered from business mode, where the current
  // buyer/seller role isn't what decides — any seller account can offer.
  const canOffer = !isOwner && isOpen && !myOffer && !!profile?.is_seller;

  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const details = [
    ["Quantity", formatQuantity(request.quantity, request.unit, units)],
    ["Deliver to", request.delivery_location ?? ""],
    ["Needed by", request.required_delivery_date ? formatDate(request.required_delivery_date, { withYear: true }) : ""],
    ...Object.entries(request.specifications ?? {}),
  ].filter(([, v]) => v) as [string, string][];

  const send = async () => {
    const p = Number(price.replace(/,/g, ""));
    const q = quantity.trim() ? Number(quantity) : undefined;
    if (!Number.isFinite(p) || p <= 0) return show({ variant: "error", title: "Enter a valid price" });
    if (q !== undefined && (!Number.isFinite(q) || q < 0)) return show({ variant: "error", title: "Enter a valid quantity" });
    if (!message.trim()) return show({ variant: "error", title: "Add a message for the buyer" });
    setBusy("send");
    try {
      await createRequestOffer(request.id, { price: p, message: message.trim(), ...(q !== undefined ? { proposed_quantity: q } : {}) });
      show({ variant: "success", title: "Offer sent" });
      onChanged();
    } catch (e) {
      show({ variant: "error", title: "Couldn't send offer", message: friendlyErrorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const respond = async (offerId: number, accept: boolean) => {
    setBusy(`${offerId}`);
    try {
      await (accept ? acceptRequestOffer(offerId) : rejectRequestOffer(offerId));
      show({
        variant: "success",
        title: accept ? "Offer accepted" : "Offer declined",
        message: accept ? "Agree the delivery details with the supplier in chat, then order through Markt." : undefined,
      });
      onChanged();
    } catch (e) {
      show({ variant: "error", title: "Couldn't update the offer", message: friendlyErrorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  // Consumer requests keep their existing screen exactly as it was: sellers
  // message the buyer rather than send a formal offer.
  if (!request.is_business) return null;

  return (
    <View className="px-6 pt-6">
      {details.length > 0 ? (
        <View className="mb-6">
          <SectionLabel>Procurement details</SectionLabel>
          <View className="flex-row flex-wrap gap-2 mt-3">
            {details.map(([label, value]) => (
              <Term key={label} label={label} value={value} />
            ))}
          </View>
        </View>
      ) : null}

      {isOwner ? (
        <>
          <SectionLabel>{offers.length === 0 ? "Offers" : `${offers.length} offer${offers.length === 1 ? "" : "s"}`}</SectionLabel>
          <View className="mt-3">
            {offers.length === 0 ? (
              <Text className="text-[14px] text-text-secondary">No offers yet. Suppliers' offers show up here.</Text>
            ) : (
              offers.map((o) => (
                <OfferCard
                  key={o.id}
                  offer={o}
                  unit={request.unit}
                  units={units}
                  unitLabel={unitLabel}
                  actions={
                    isOpen && o.status === "PENDING" ? (
                      <View className="flex-row gap-2 mt-3">
                        <TouchableOpacity
                          disabled={busy !== null}
                          onPress={() => respond(o.id, false)}
                          className="flex-1 h-11 rounded items-center justify-center border border-border-strong"
                        >
                          <Text className="text-sm font-bold text-text-primary">Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          disabled={busy !== null}
                          onPress={() => respond(o.id, true)}
                          className="flex-1 h-11 rounded items-center justify-center bg-primary-fill"
                        >
                          <Text className="text-sm font-bold text-text-on-primary">{busy === `${o.id}` ? "…" : "Accept"}</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null
                  }
                />
              ))
            )}
          </View>
        </>
      ) : myOffer ? (
        <>
          <SectionLabel>Your offer</SectionLabel>
          <View className="mt-3">
            <OfferCard offer={myOffer} unit={request.unit} units={units} unitLabel={unitLabel} />
          </View>
        </>
      ) : canOffer ? (
        <View className="p-4 rounded border border-border bg-surface-raised">
          <Text className="text-[16px] font-bold text-text-primary">Make an offer</Text>
          <Text className="mt-2 mb-1.5 text-[13px] font-semibold text-text-secondary">Your price (₦)</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholderTextColor={t.textMuted}
            accessibilityLabel="Your price"
            className="h-12 rounded-xl px-3 text-[16px] text-text-primary bg-surface-sunken"
          />
          <Text className="mt-3 mb-1.5 text-[13px] font-semibold text-text-secondary">
            How much can you supply?{unitLabel ? ` (${unitLabel})` : ""}
          </Text>
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
            placeholderTextColor={t.textMuted}
            accessibilityLabel="Quantity you can supply"
            className="h-12 rounded-xl px-3 text-[16px] text-text-primary bg-surface-sunken"
          />
          <Text className="mt-3 mb-1.5 text-[13px] font-semibold text-text-secondary">Message</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
            placeholder="What you can supply, quality, delivery…"
            placeholderTextColor={t.textMuted}
            accessibilityLabel="Message to the buyer"
            className="min-h-[90px] rounded-xl px-3 py-3 text-[15px] text-text-primary bg-surface-sunken"
          />
          <View className="mt-4">
            <Button text="Send offer" loading={busy === "send"} onPress={send} />
          </View>
        </View>
      ) : null}
    </View>
  );
}
