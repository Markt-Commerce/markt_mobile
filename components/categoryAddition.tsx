import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Check, Search, X } from "lucide-react-native";
import { Category } from "../models/categories";
import { getAllCategories } from "../services/sections/categories";
import { useTokens } from "../theme/useTokens";

interface CategoryAdditionProps {
  visible: boolean;
  categories: Category[];
  parentSelectedCategories?: Category[];
  onClose: () => void;
  onConfirm: (selected: Category[]) => void;
}

export const CategoryAddition = ({
  visible,
  categories,
  parentSelectedCategories = [],
  onClose,
  onConfirm,
}: CategoryAdditionProps) => {
  const [selectedCategories, setSelectedCategories] = React.useState<
    Category[]
  >(parentSelectedCategories);
  const [query, setQuery] = React.useState("");
  // Self-heal: parents fetch categories once on mount and swallow failures, so
  // a single bad request used to leave this picker empty forever ('No
  // categories match ""'). If we open with nothing, fetch our own copy.
  const [fallbackCategories, setFallbackCategories] = React.useState<
    Category[]
  >([]);
  const [loadingFallback, setLoadingFallback] = React.useState(false);
  const allCategories =
    categories.length > 0 ? categories : fallbackCategories;

  React.useEffect(() => {
    if (!visible || categories.length > 0 || fallbackCategories.length > 0)
      return;
    let cancelled = false;
    setLoadingFallback(true);
    getAllCategories()
      .then((cats) => {
        if (!cancelled) setFallbackCategories(cats ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingFallback(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, categories.length, fallbackCategories.length]);
  const t = useTokens();
  const textColor = t.textPrimary;
  const mutedColor = t.textSecondary;

  React.useEffect(() => {
    setSelectedCategories(parentSelectedCategories);
  }, [parentSelectedCategories]);

  const toggleCategory = (cat: Category) => {
    setSelectedCategories((prev) =>
      prev.find((c) => c.id === cat.id)
        ? prev.filter((c) => c.id !== cat.id)
        : [...prev, cat],
    );
  };

  const handleDone = () => {
    onConfirm(selectedCategories);
    onClose();
  };

  const handleClear = () => setSelectedCategories([]);
  const handleSelectAll = () => setSelectedCategories(allCategories);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCategories;
    return allCategories.filter((c) => c.name.toLowerCase().includes(q));
  }, [allCategories, query]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        {/* Card */}
        <View
          className="mt-auto rounded-t overflow-hidden bg-surface-raised"
        >
          {/* Header */}
          <View
            className="px-5 pt-4 pb-3 border-b border-border"
          >
            <View className="flex-row items-center justify-between">
              <Text
                className="text-lg font-bold text-text-primary"
              >
                Select Categories
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="w-9 h-9 rounded items-center justify-center border active:opacity-80 bg-surface-sunken border-border"
              >
                <X size={18} color={textColor} />
              </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View
              className="mt-3 flex-row items-center border rounded px-3 h-11 bg-surface-sunken border-border"
            >
              <Search size={18} color={mutedColor} />
              <TextInput
                className="flex-1 ml-2 text-text-primary"
                placeholder="Search categories"
                placeholderTextColor={t.textSecondary}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery("")} className="pl-2">
                  <Text
                    className="text-sm font-semibold text-text-primary"
                  >
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Toolbar: count + actions */}
            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View
                  className="px-2 py-1 rounded border bg-surface-sunken border-border"
                >
                  <Text
                    className="text-xs text-text-primary"
                  >
                    Selected: {selectedCategories.length}
                  </Text>
                </View>
              </View>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleClear}
                  className="active:opacity-80"
                >
                  <Text
                    className="text-sm font-semibold text-text-secondary"
                  >
                    Clear
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSelectAll}
                  className="active:opacity-80"
                >
                  <Text
                    className="text-sm font-semibold text-text-primary"
                  >
                    Select all
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Body: chips grid */}
          <ScrollView
            className="max-h-[60%]"
            contentContainerClassName="px-5 py-4"
            keyboardShouldPersistTaps="handled"
          >
            {loadingFallback ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="small" color={mutedColor} />
                <Text
                  className="mt-3 text-text-secondary"
                >
                  Loading categories…
                </Text>
              </View>
            ) : filtered.length === 0 ? (
              <View className="py-10 items-center">
                <Text className={"text-text-secondary"}>
                  {allCategories.length === 0
                    ? "Couldn't load categories. Please check your connection, close this window, and try again."
                    : `No categories match "${query}".`}
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap">
                {filtered.map((cat) => {
                  const isSelected = !!selectedCategories.find(
                    (c) => c.id === cat.id,
                  );
                  return (
                    <Pressable
                      key={cat.id.toString()}
                      onPress={() => toggleCategory(cat)}
                      className={`flex-row items-center mr-2 mb-2 px-3 py-2 rounded border
                        ${isSelected ? "bg-primary-fill border-primary" : "bg-surface-sunken border-border"}
                      `}
                    >
                      {isSelected ? (
                        <Check size={16} color={t.textOnPrimary} />
                      ) : (
                        <View className="w-4 h-4 rounded mr-0" />
                      )}
                      <Text
                        className={`ml-2 text-sm ${isSelected ? "text-white font-semibold" : "text-text-primary"}`}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Footer actions */}
          <View
            className="px-5 pb-6 pt-2 border-t border-border"
          >
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 h-12 rounded items-center justify-center border active:opacity-90 bg-surface-sunken border-border"
              >
                <Text
                  className="font-semibold text-text-primary"
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDone}
                className="flex-1 h-12 rounded items-center justify-center bg-primary-fill active:opacity-90"
              >
                <Text className="text-white font-semibold">Done</Text>
              </TouchableOpacity>
            </View>

            {/* Subtext hint */}
            <View className="items-center mt-3">
              <Text
                className="text-xs text-text-secondary"
              >
                Tip: pick the best-fitting categories for better discovery.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CategoryAddition;
