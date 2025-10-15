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
  const [selectedCategories, setSelectedCategories] = React.useState<Category[]>(
    parentSelectedCategories
  );
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    setSelectedCategories(parentSelectedCategories);
  }, [parentSelectedCategories]);

  const toggleCategory = (cat: Category) => {
    setSelectedCategories((prev) =>
      prev.find((c) => c.id === cat.id)
        ? prev.filter((c) => c.id !== cat.id)
        : [...prev, cat]
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
        <View className="mt-auto bg-white rounded-t-3xl overflow-hidden">
          {/* Header */}
          <View className="px-5 pt-4 pb-3 border-b border-neutral-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-extrabold text-[#0f172a]">
                Select Categories
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="w-9 h-9 rounded-full items-center justify-center bg-neutral-100 active:opacity-80"
              >
                <X size={18} color="#0f172a" />
              </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View className="mt-3 flex-row items-center bg-neutral-100 rounded-xl px-3 h-11">
              <Search size={18} color="#64748b" />
              <TextInput
                className="flex-1 ml-2 text-[#0f172a]"
                placeholder="Search categories"
                placeholderTextColor="#94a3b8"
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery("")} className="pl-2">
                  <Text className="text-sky-600 text-sm font-semibold">Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Toolbar: count + actions */}
            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="px-2 py-1 rounded-full bg-neutral-100 border border-neutral-200">
                  <Text className="text-xs text-[#0f172a]">
                    Selected: {selectedCategories.length}
                  </Text>
                </View>
              </View>
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={handleClear} className="active:opacity-80">
                  <Text className="text-sm text-neutral-600 font-semibold">Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSelectAll} className="active:opacity-80">
                  <Text className="text-sm text-sky-700 font-semibold">Select all</Text>
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
                <Text className="text-neutral-500">No categories match “{query}”.</Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap">
                {filtered.map((cat) => {
                  const isSelected = !!selectedCategories.find((c) => c.id === cat.id);
                  return (
                    <Pressable
                      key={cat.id.toString()}
                      onPress={() => toggleCategory(cat)}
                      className={`flex-row items-center mr-2 mb-2 px-3 py-2 rounded-full border
                        ${isSelected ? "bg-[#e9242a] border-[#e9242a]" : "bg-neutral-100 border-neutral-200"}
                      `}
                    >
                      {isSelected ? (
                        <Check size={16} color="#fff" />
                      ) : (
                        <View className="w-4 h-4 rounded-full mr-0" />
                      )}
                      <Text
                        className={`ml-2 text-sm ${isSelected ? "text-white font-semibold" : "text-[#0f172a]"}`}
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
          <View className="px-5 pb-6 pt-2 border-t border-neutral-200">
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 h-12 rounded-full items-center justify-center bg-neutral-100 border border-neutral-200 active:opacity-90"
              >
                <Text className="text-[#0f172a] font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDone}
                className="flex-1 h-12 rounded-full items-center justify-center bg-[#0f172a] active:opacity-90"
              >
                <Text className="text-white font-semibold">Done</Text>
              </TouchableOpacity>
            </View>

            {/* Subtext hint */}
            <View className="items-center mt-3">
              <Text className="text-neutral-500 text-xs">
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
