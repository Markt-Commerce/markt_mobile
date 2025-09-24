import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { ArrowLeft, Truck, Package, User, Dot, PlusSquare, Search, Home, LucideIcon } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

const notifications = [
  {
    id: 1,
    type: 'avatar',
    name: 'Liam Carter liked your post',
    time: '2d',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDN4yy6jkI988RPXDv_c1XIvFc9hBXXhE6NHVuLOnNvvSd5lnHQ8yx1e1xT9eB86_TDBMZvXIVi1KvZ-JmNX-FHfdm6ttmcxPvk8NC6L2YY_oxUmdnBZmiQaYNU1Ea5U17D5shJYHms-mj-FGXNpIwzKR4_Gle7smAP1UBwDIDlvl1VKNRHinW4PDVm0KJrcdt02QNM9CQGHK3IWR2f0Use9paZl6SCRQxZRBJEnsuysWKJCWCRcSXkLWw1LrlLalxzSemGcWq5ug'
  },
  {
    id: 2,
    type: 'avatar',
    name: 'You have a new follower',
    time: '1d',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVqT_khGhGbUlxaXHdg1NSA065X_k4IeqWZavkUlXSc335Rxz5D2cgWkRcYh9M1EDdmU1tap8Qkd7bRBcKwevhDT0dEr7nnhNLt-FphLRtXyrFDRTUHItWl550VBVR3NcnNk9WFsBCecVjcaJXSZMw2cfu7t4oMJZwysWfe6EqOBBYjaOBeiGHQb1E3_EfzlMraGxWjvLO7dyau2yOejsI00iHPsJgnPPEMjq5IqRpL-Grqj_tMJP-r3FQze7ltKga0iis-kQS0w'
  },
  {
    id: 3,
    type: 'icon',
    icon: Truck,
    name: 'Your order has been shipped',
    time: '1d'
  },
  {
    id: 4,
    type: 'avatar',
    name: 'Sophia Bennett sent you a message',
    time: '2d',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANN47Phzq5Tpj6yntoJRKamA75JS6Ur7G_hM6UiEf-MrYxRsxwGMjevG3YJFFI8Ybdt_wxJqdxUAj1XdSjJFau_fGxSHlCRYa-fzmJbOonWKvUDV-m0ojCsnRwVPT6TtsBTXHFPHWGGjaHZw_jbMGzvJEfsTGNaZcSFxhu_mx8Dvg6EQW13VF27zC1qz_m1x0InN9TbfenVyZxWIy7dLXYADEDXMMydxQKpZXJFCDKS-7q9pQ_0BSmQzFF6CXpK6cq1j6D0v_nIw'
  },
  {
    id: 5,
    type: 'icon',
    icon: Package,
    name: 'Your order has been delivered',
    time: '2d'
  }
];


const determineIcon = (type:string, icon:string) => {
    switch (type) {
      case 'avatar':
        return <Image source={{ uri: icon }} className="h-14 w-14 rounded-full" />;
      case 'order-shipping':
        return <Truck size={24} color="#171312" />;
      case 'order-delivered':
          return <Package size={24} color="#171312" />;
      case 'message':
          return <Dot size={24} color="#171312" />;
      default:
        return null;
    }
  }

export default function NotificationsScreen() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <TouchableOpacity className="h-12 w-12 justify-center items-center">
          <ArrowLeft size={24} color="#171312" />
        </TouchableOpacity>
        <Text className="text-[#171312] text-lg font-bold text-center flex-1 pr-12">
          Notifications
        </Text>
      </View>

      {/* Today */}
      <Text className="text-[#171312] text-lg font-bold px-4 pt-4 pb-2">Today</Text>
      {notifications.slice(0, 3).map((item) => (
        <View key={item.id} className="flex-row items-center gap-4 px-4 py-2 min-h-[72px]">
          {item.type === 'avatar' ? (
            <Image source={{ uri: item.image }} className="h-14 w-14 rounded-full" />
          ) : (
            <View className="size-12 rounded-lg bg-[#f4f2f1] items-center justify-center">
                {determineIcon(item.type, item.image!)}
            </View>
          )}
          <View className="flex flex-col justify-center">
            <Text className="text-[#171312] text-base font-medium">{item.name}</Text>
            <Text className="text-[#826f68] text-sm">{item.time}</Text>
          </View>
        </View>
      ))}

      {/* Yesterday */}
      <Text className="text-[#171312] text-lg font-bold px-4 pt-4 pb-2">Yesterday</Text>
      {notifications.slice(3).map((item) => (
        <View key={item.id} className="flex-row items-center gap-4 px-4 py-2 min-h-[72px]">
          {item.type === 'avatar' ? (
            <Image source={{ uri: item.image }} className="h-14 w-14 rounded-full" />
          ) : (
            <View className="size-12 rounded-lg bg-[#f4f2f1] items-center justify-center">
              {determineIcon(item.type, item.image!)}
            </View>
          )}
          <View className="flex flex-col justify-center">
            <Text className="text-[#171312] text-base font-medium">{item.name}</Text>
            <Text className="text-[#826f68] text-sm">{item.time}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
