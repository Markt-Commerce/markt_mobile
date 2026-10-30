import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Trash2 } from "lucide-react-native";
import InputSheet from "./InputSheet";
import { ProductResponse } from "../models/products";
import { resolveProductImageUri } from "../utils/imageUri";
import { formatNaira } from "../utils/formatCurrency";
import { useTheme } from "./themeProvider";
import { useTokens } from "../theme/useTokens";

type Product = {
  id: string;
  name: string;
  price: number;
  image?: string;
};

type Props = {
  visible: boolean;
  products: ProductResponse[];
  loading?: boolean;
  disabled?: boolean;
  onClose: () => void;
  onSelect: (p: Product) => void;
  onRemove?: (p: Product) => void;
  selectedProducts: ProductResponse[];
};

/**
 * Picks products to tag on a post or to send in a chat.
 *
 * Built on InputSheet (a Modal), not @gorhom/bottom-sheet. A gorhom sheet
 * lays itself out inside whatever view it is rendered in, and both callers
 * render this inside another sheet: the post form's scroll area, and the
 * quick-chat Modal. So it opened squeezed into that area, under the post
 * form's "Create Post" bar, and could not be dismissed. A Modal has no
 * gesture-handler root on Android, so the pan-to-close gesture never fired,
 * and there was no close button to fall back on. A Modal is its own window,
 * so it covers the screen wherever it is rendered, and the footer gives it a
 * button that always closes it.
 */
export default function ProductPicker({
  visible,
  products,
  loading = false,
  disabled = false,
  selectedProducts,
  onClose,
  onSelect,
  onRemove,
}: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const t = useTokens();

  const isSelected = (product: Product) =>
    selectedProducts.some((p) => p.id === product.id);

  const handleSelect = (item: Product) => {
    if (disabled) return;
    onSelect(item);
  };

  const handleRemove = (item: Product) => {
    if (onRemove) {
      onRemove(item);
    }
  };

  const footer = (
    <>
      <Text className="flex-1 text-[12px] text-text-muted" numberOfLines={1}>
        {selectedProducts.length > 0
          ? `${selectedProducts.length} selected`
          : ""}
      </Text>
      <TouchableOpacity
        onPress={onClose}
        accessibilityRole="button"
        className="min-h-[44px] items-center justify-center rounded-xl px-5 bg-primary-fill"
      >
        <Text className="text-[15px] font-bold text-text-on-primary">
          {selectedProducts.length > 0 ? "Done" : "Close"}
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <InputSheet
      title="Select Product"
      visible={visible}
      onClose={onClose}
      footer={footer}
      maxHeight="80%"
    >
      {loading ? (
        <View className="items-center justify-center py-12">
          <ActivityIndicator
            size="large"
            color={t.textPrimary}
          />
          <Text
            className="text-text-secondary text-sm mt-3"
          >
            Loading products...
          </Text>
        </View>
      ) : products.length === 0 ? (
        <View className="items-center justify-center py-12">
          <Text
            className="text-center text-text-secondary"
          >
            No products available.
          </Text>
          <Text
            className="text-center text-sm mt-1 text-text-secondary"
          >
            Create products in your dashboard first.
          </Text>
        </View>
      ) : (
        // A plain map, not a FlatList: InputSheet's body is already a
        // ScrollView, and a list nested in it would only warn and lose its
        // windowing anyway. Both callers fetch a single page of the seller's
        // own products.
        products.map((item) => {
          const selected = isSelected(item);
          const imageUri = resolveProductImageUri(item);

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleSelect(item)}
              disabled={disabled}
              className={`flex-row items-center p-3 mb-2 rounded border ${
                selected
                  ? isDark
                    ? "bg-dark-elevated border-dark-border-strong"
                    : "bg-white border-border"
                  : isDark
                    ? "bg-dark-surface border-transparent"
                    : "bg-surface-sunken border-transparent"
              } ${disabled ? "opacity-50" : ""}`}
              accessibilityRole="button"
              accessibilityLabel={`Select ${item.name}, priced at ${formatNaira(item.price)}`}
            >
              <Image
                source={
                  imageUri
                    ? { uri: imageUri }
                    : require("../assets/icon.png")
                }
                className="w-12 h-12 rounded border mr-3 bg-surface-sunken border-border"
              />

              <View className="flex-1">
                <Text
                  className="text-base font-medium text-text-primary"
                >
                  {item.name}
                </Text>
                <Text
                  className="text-sm text-text-secondary"
                >
                  {formatNaira(item.price)}
                </Text>
              </View>

              {onRemove && (
                <TouchableOpacity
                  onPress={() => handleRemove(item)}
                  className="p-2 rounded border bg-surface-raised border-border"
                  accessibilityLabel={`Remove ${item.name}`}
                >
                  <Trash2 color={t.dangerText} size={20} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </InputSheet>
  );
}
