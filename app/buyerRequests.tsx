import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, ChevronDown, User } from 'lucide-react-native';

const buyers = [
  {
    title: 'Vintage Band T-Shirt',
    description: 'Looking for a vintage band t-shirt, preferably from the 90s. Size medium.',
    category: 'Clothing',
  },
  {
    title: 'Gaming Laptop',
    description: 'Need a high-end gaming laptop with at least 16GB RAM and a powerful GPU.',
    category: 'Electronics',
  },
  {
    title: 'Minimalist Sofa',
    description: 'Searching for a modern minimalist sofa in a neutral color, suitable for a small apartment.',
    category: 'Home Goods',
  },
  {
    title: 'Designer Sneakers',
    description: 'Looking for a pair of designer sneakers, size 10, in good condition.',
    category: 'Clothing',
  },
];

const categories = ['All', 'Clothing', 'Electronics', 'Home Goods'];

export default function BuyerRequestsScreen() {
  return (
    <View className="flex-1 bg-white justify-between">
      <View>
        <View className="flex-row items-center justify-between p-4 pb-2">
          <ArrowLeft color="#171311" size={24} />
          <Text className="text-[#171311] text-lg font-bold text-center flex-1 pr-12">
            Buyer Requests
          </Text>
        </View>

        <ScrollView horizontal className="flex-row gap-3 px-3">
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              className="flex-row items-center h-8 px-2 pl-4 rounded-full bg-[#f4f1f0]"
            >
              <Text className="text-sm font-medium text-[#171311]">{category}</Text>
              <ChevronDown size={20} color="#171311" />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView className="mt-2">
          {buyers.map((buyer, index) => (
            <View
              key={index}
              className="flex-row justify-between gap-4 bg-white px-4 py-3 border-b border-[#f4f1f0]"
            >
              <View className="flex-row items-start gap-4 flex-1">
                <View className="size-12 items-center justify-center rounded-lg bg-[#f4f1f0]">
                  <User color="#171311" size={24} />
                </View>
                <View className="flex-1 justify-center">
                  <Text className="text-base font-medium text-[#171311]">
                    {buyer.title}
                  </Text>
                  <Text className="text-sm text-[#876d64]">{buyer.description}</Text>
                  <Text className="text-sm text-[#876d64]">{buyer.category}</Text>
                </View>
              </View>
              <TouchableOpacity className="h-8 px-4 rounded-full bg-[#f4f1f0] justify-center items-center">
                <Text className="text-sm font-medium text-[#171311]">Offer</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
