import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { ArrowLeft, Truck, Package, User, Dot, PlusSquare, Search, Home, LucideIcon } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { NotificationItem } from '../models/notifications';
import { getNotifications, markAllAsRead } from '../services/sections/notifications';



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
  const [notifications, setNotifications] = React.useState<NotificationItem[] | null>(null);

  React.useEffect(() => {
    const fetchNotifications = async () => {
      const data = await getNotifications();
      setNotifications(data.items);
    };
    fetchNotifications();
  }, []);

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

      {notifications?.length === 0 ? (
        <View className="flex-1 items-center justify-center mt-20">
          <Text className="text-[#826f68] text-base">No notifications available.</Text>
        </View>
      ): (<>
        {/* Today */}
      <Text className="text-[#171312] text-lg font-bold px-4 pt-4 pb-2">Today</Text>
      {notifications?.filter((item) => new Date(item.created_at).toDateString() === new Date().toDateString()).map((item) => (
        <View key={item.id} className="flex-row items-center gap-4 px-4 py-2 min-h-[72px]">
            <View className="size-12 rounded-lg bg-[#f4f2f1] items-center justify-center">
                {determineIcon(item.type, item.metadata_['icon']!)}
            </View>
          <View className="flex flex-col justify-center">
            <Text className="text-[#171312] text-base font-medium">{item.title}</Text>
            <Text className="text-[#826f68] text-sm">{item.created_at}</Text>
          </View>
        </View>
      ))}

      {/* Yesterday */}
      <Text className="text-[#171312] text-lg font-bold px-4 pt-4 pb-2">Yesterday</Text>
      {notifications?.filter((item) => new Date(item.created_at).toDateString() === new Date(Date.now() - 86400000).toDateString()).map((item) => (
        <View key={item.id} className="flex-row items-center gap-4 px-4 py-2 min-h-[72px]">
            <View className="size-12 rounded-lg bg-[#f4f2f1] items-center justify-center">
                {determineIcon(item.type, item.metadata_['icon']!)}
            </View>
          <View className="flex flex-col justify-center">
            <Text className="text-[#171312] text-base font-medium">{item.title}</Text>
            <Text className="text-[#826f68] text-sm">{item.created_at}</Text>
          </View>
        </View>
      ))}
      </>)}

      
    </ScrollView>
  );
}
