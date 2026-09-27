import React, { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View, ActivityIndicator } from "react-native";
import InputSheet from "./InputSheet";
import InstagramGrid, { type PickedImage } from "./imagePicker";
import { useTokens } from "../theme/useTokens";
import { updateProduct } from "../services/sections/product";
import { attemptMultipleUpload } from "../services/sections/media";
import { useToast } from "./ToastProvider";
import { friendlyErrorMessage } from "../utils/errorMessages";
import type { ProductResponse } from "../models/products";

/** Photos already on the product, marked so they can be told apart from ones
 *  picked just now. Anything carrying an existing media id is kept by id;
 *  everything else has to be uploaded before it has one. */
const EXISTING = "media:";

function toPicked(product: ProductResponse | null): PickedImage[] {
  return (product?.images ?? [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((img) => ({
      id: `${EXISTING}${img.media_id}`,
      uri:
        (img.media as any)?.original_url ??
        (img.media as any)?.url ??
        "",
    }))
    .filter((p) => !!p.uri);
}

/**
 * Quick edit for a product from the inventory list.
 *
 * Scoped to what changes after a listing goes up: price, stock, whether it is
 * live, and the photos. Variants, categories and description stay out — they
 * are set once and rarely revisited, and putting them here would make the
 * common case slow to serve the rare one.
 *
 * Photos were in that excluded list too, on the grounds that they belonged to
 * "the full product form". That form only exists for *creating* a product, so
 * the effect was that a seller could never add or replace a photo after
 * publishing — the one piece of a listing most worth improving once it is up
 * and not selling.
 *
 * Before this the inventory offered exactly one action, Delete, so a seller
 * whose price changed had to delete the listing and build it again — losing
 * its reviews, its view count and its place in anyone's saved items.
 */
export default function InventoryEditSheet({
  product,
  visible,
  onClose,
  onSaved,
}: {
  product: ProductResponse | null;
  visible: boolean;
  onClose: () => void;
  onSaved: (updated: ProductResponse) => void;
}) {
  const t = useTokens();
  const { show } = useToast();
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [active, setActive] = useState(true);
  const [photos, setPhotos] = useState<PickedImage[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!product) return;
    setPrice(String(product.price ?? ""));
    setStock(String(product.stock ?? ""));
    setActive((product.status ?? "active") === "active");
    setPhotos(toPicked(product));
  }, [product]);

  if (!product) return null;

  const priceValue = Number(price);
  const stockValue = Number(stock);
  const priceValid = Number.isFinite(priceValue) && priceValue > 0;
  const stockValid = Number.isInteger(stockValue) && stockValue >= 0;
  // Compared against what the product came with, so a seller who only
  // touched the price does not send media_ids at all -- the server reads an
  // empty list as "remove every photo".
  const originalPhotoKey = toPicked(product).map((p) => p.id).join(",");
  const photosChanged = photos.map((p) => p.id).join(",") !== originalPhotoKey;
  // A listing with no photo is one buyers scroll past. Removing the last one
  // is refused here rather than saved and regretted.
  const photosValid = photos.length > 0;
  const canSave = priceValid && stockValid && photosValid && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      let mediaIds: number[] | undefined;
      if (photosChanged) {
        // Only the newly picked ones are uploaded; the rest already have ids.
        const fresh = photos.filter((p) => !p.id.startsWith(EXISTING));
        const uploaded = fresh.length ? await attemptMultipleUpload(fresh) : [];
        const newIds = uploaded
          .filter((r) => r?.media?.id)
          .map((r) => r.media.id as number);
        if (newIds.length !== fresh.length) {
          throw new Error("Some photos could not be uploaded.");
        }
        // Rebuilt in the order shown, so the grid the seller arranged is the
        // order buyers see.
        let next = 0;
        mediaIds = photos.map((p) =>
          p.id.startsWith(EXISTING)
            ? Number(p.id.slice(EXISTING.length))
            : newIds[next++],
        );
      }

      const updated = await updateProduct(product.id, {
        price: priceValue,
        stock: stockValue,
        // "archived" is the server's word for a listing that exists but is
        // not on sale. This used to send "inactive", which is not one of its
        // statuses at all, so hiding a product was rejected -- and since this
        // sheet always sends a status, so was changing the price.
        status: active ? "active" : "archived",
        ...(mediaIds ? { media_ids: mediaIds } : {}),
      });
      onSaved({ ...product, ...updated });
      show({ variant: "success", title: "Saved", message: `${product.name} updated.` });
      onClose();
    } catch (e) {
      show({
        variant: "error",
        title: "Could not save",
        message: friendlyErrorMessage(e, "Please try again."),
      });
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <>
      <Text className="flex-1 text-[12px] text-text-muted" numberOfLines={1}>
        {saving
          ? photosChanged
            ? "Uploading photos…"
            : "Saving…"
          : active
            ? "Listed"
            : "Hidden from buyers"}
      </Text>
      <Pressable
        onPress={save}
        disabled={!canSave}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSave, busy: saving }}
        className={`min-h-[44px] flex-row items-center justify-center gap-2 rounded-xl px-5 ${
          canSave ? "bg-primary-fill" : "bg-surface-sunken"
        }`}
      >
        {saving ? <ActivityIndicator size="small" color={t.textSecondary} /> : null}
        <Text
          className={`text-[15px] font-bold ${
            canSave ? "text-text-on-primary" : "text-text-muted"
          }`}
        >
          {saving ? "Saving…" : "Save changes"}
        </Text>
      </Pressable>
    </>
  );

  return (
    <InputSheet
      visible={visible}
      onClose={onClose}
      title={product.name}
      busy={saving}
      footer={footer}
    >
            <Text className="text-xs font-bold uppercase tracking-[1.5px] text-text-muted mb-2">
              Photos
            </Text>
            <InstagramGrid
              value={photos}
              onChange={setPhotos}
              numColumns={4}
              max={8}
              gap={8}
              emptyPlaceholdersCount={0}
            />
            <Text className="text-xs text-text-secondary mt-1">
              {photosValid
                ? "Tap + to add. Long-press a photo to remove it. The first one is what buyers see."
                : "Keep at least one photo — listings without one get scrolled past."}
            </Text>

            <Text className="text-xs font-bold uppercase tracking-[1.5px] text-text-muted mb-2 mt-5">
              Price
            </Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={t.textMuted}
              accessibilityLabel="Product price"
              className={`h-12 px-4 rounded border text-base text-text-primary bg-surface-sunken ${
                priceValid ? "border-border" : "border-danger"
              }`}
            />
            {!priceValid ? (
              <Text className="text-xs text-danger-text mt-1">
                Enter a price greater than zero.
              </Text>
            ) : null}

            <Text className="text-xs font-bold uppercase tracking-[1.5px] text-text-muted mb-2 mt-5">
              Stock
            </Text>
            <TextInput
              value={stock}
              onChangeText={setStock}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={t.textMuted}
              accessibilityLabel="Stock on hand"
              className={`h-12 px-4 rounded border text-base text-text-primary bg-surface-sunken ${
                stockValid ? "border-border" : "border-danger"
              }`}
            />
            {!stockValid ? (
              <Text className="text-xs text-danger-text mt-1">
                Enter a whole number, zero or more.
              </Text>
            ) : null}

            {/* Live rather than "status": the seller's question is whether
                buyers can see it, not what the enum is called. */}
            <View className="flex-row items-center justify-between mt-6">
              <View className="flex-1 pr-4">
                <Text className="text-base font-semibold text-text-primary">
                  Listed
                </Text>
                <Text className="text-xs text-text-secondary mt-0.5">
                  {active ? "Buyers can find and order this." : "Hidden from buyers."}
                </Text>
              </View>
              <Pressable
                onPress={() => setActive((v) => !v)}
                accessibilityRole="switch"
                accessibilityState={{ checked: active }}
                accessibilityLabel="Listed"
                className={`w-14 h-8 rounded-full px-1 justify-center ${
                  active ? "bg-primary-fill" : "bg-border-strong"
                }`}
              >
                <View
                  className="w-6 h-6 rounded-full bg-surface-overlay"
                  style={{ transform: [{ translateX: active ? 24 : 0 }] }}
                />
              </Pressable>
            </View>

    </InputSheet>
  );
}
