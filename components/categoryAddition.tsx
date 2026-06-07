import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Check, Search, X } from "lucide-react-native";
import { Category } from "../models/categories";
import { useTheme } from "./themeProvider";

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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const textColor = isDark ? "#f5f5f5" : "#000000";
  const mutedColor = isDark ? "#c6c5cf" : "#71717A";

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
  const handleSelectAll = () => setSelectedCategories(categories);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, query]);

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
          className={`mt-auto rounded-t overflow-hidden ${isDark ? "bg-dark-surface" : "bg-white"}`}
        >
          {/* Header */}
          <View
            className={`px-5 pt-4 pb-3 border-b ${isDark ? "border-dark-border" : "border-border"}`}
          >
            <View className="flex-row items-center justify-between">
              <Text
                className={`text-lg font-geist font-bold ${isDark ? "text-dark-text" : "text-black"}`}
              >
                Select Categories
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className={`w-9 h-9 rounded items-center justify-center border active:opacity-80 ${isDark ? "bg-dark-elevated border-dark-border-strong" : "bg-surface border-border"}`}
              >
                <X size={18} color={textColor} />
              </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View
              className={`mt-3 flex-row items-center border rounded px-3 h-11 ${isDark ? "bg-dark-elevated border-dark-border-strong" : "bg-surface border-border"}`}
            >
              <Search size={18} color={mutedColor} />
              <TextInput
                className={`flex-1 ml-2 ${isDark ? "text-dark-text" : "text-black"}`}
                placeholder="Search categories"
                placeholderTextColor={isDark ? "#c6c5cf" : "#A1A1AA"}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery("")} className="pl-2">
                  <Text
                    className={`text-sm font-semibold ${isDark ? "text-dark-text" : "text-black"}`}
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
                  className={`px-2 py-1 rounded border ${isDark ? "bg-dark-elevated border-dark-border-strong" : "bg-surface border-border"}`}
                >
                  <Text
                    className={`text-xs ${isDark ? "text-dark-text" : "text-black"}`}
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
                    className={`text-sm font-semibold ${isDark ? "text-dark-muted" : "text-tertiary"}`}
                  >
                    Clear
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSelectAll}
                  className="active:opacity-80"
                >
                  <Text
                    className={`text-sm font-semibold ${isDark ? "text-dark-text" : "text-black"}`}
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
            {filtered.length === 0 ? (
              <View className="py-10 items-center">
                <Text className={isDark ? "text-dark-muted" : "text-tertiary"}>
                  No categories match "{query}".
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
                        ${isSelected ? "bg-primary border-primary" : isDark ? "bg-dark-elevated border-dark-border-strong" : "bg-surface border-border"}
                      `}
                    >
                      {isSelected ? (
                        <Check size={16} color="#fff" />
                      ) : (
                        <View className="w-4 h-4 rounded mr-0" />
                      )}
                      <Text
                        className={`ml-2 text-sm ${isSelected ? "text-white font-semibold" : isDark ? "text-dark-text" : "text-black"}`}
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
            className={`px-5 pb-6 pt-2 border-t ${isDark ? "border-dark-border" : "border-border"}`}
          >
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                className={`flex-1 h-12 rounded items-center justify-center border active:opacity-90 ${isDark ? "bg-dark-elevated border-dark-border-strong" : "bg-surface border-border"}`}
              >
                <Text
                  className={`font-semibold ${isDark ? "text-dark-text" : "text-black"}`}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDone}
                className="flex-1 h-12 rounded items-center justify-center bg-primary active:opacity-90"
              >
                <Text className="text-white font-semibold">Done</Text>
              </TouchableOpacity>
            </View>

            {/* Subtext hint */}
            <View className="items-center mt-3">
              <Text
                className={`text-xs ${isDark ? "text-dark-muted" : "text-tertiary"}`}
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
