import { StyleSheet, Text, View, Modal, Pressable, ScrollView, TouchableOpacity } from "react-native";
import React from "react";
import { Category } from "../models/categories"; // Adjust path

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
  const [selectedCategories, setSelectedCategories] = React.useState<Category[]>(parentSelectedCategories);

  //reset when parentSelectedCategories changes
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-white rounded-2xl w-11/12 max-h-[70%] p-4">
          <Text className="text-lg font-bold mb-4">Select Categories</Text>
          <ScrollView>
            {categories.map((cat) => {
              const isSelected = !!selectedCategories.find((c) => c.id === cat.id);
              return (
                <Pressable
                  key={cat.id.toString()}
                  onPress={() => toggleCategory(cat)}
                  className={`flex-row justify-between items-center px-3 py-2 rounded-lg mb-2 ${
                    isSelected ? "bg-[#e9242a]" : "bg-[#f4f0f0]"
                  }`}
                >
                  <Text className={`text-base ${isSelected ? "text-white" : "text-[#181111]"}`}>
                    {cat.name}
                  </Text>
                  {isSelected && <Text className="text-white font-bold">✓</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            onPress={handleDone}
            className="mt-4 bg-[#181111] rounded-full py-3 items-center"
          >
            <Text className="text-white font-bold">Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CategoryAddition;

const styles = StyleSheet.create({});
