// screens/NotificationsScreen.tsx
import React from 'react';
import { View, Text, ScrollView, Switch, Alert } from 'react-native';
import { useNotifications, useUpdateNotifications } from '../../hooks/useNotification';

export default function NotificationsScreen() {
  const { data, isLoading } = useNotifications();
  const update = useUpdateNotifications();

  const toggle = (k: 'push'|'email'|'sms', val: boolean) => {
    update.mutate({ ...(data || {}), [k]: val }, {
      onError(e) { Alert.alert('Failed', (e as any).message || 'Could not update'); }
    });
  };

  if (isLoading) return <View className="flex-1 justify-center items-center"><Text>Loading...</Text></View>;

  return (
    <ScrollView className="bg-white p-4">
      <View className="flex-row justify-between items-center py-3 border-b">
        <View><Text className="text-base font-medium">Push Notifications</Text><Text className="text-sm text-[#876d64]">Push alerts</Text></View>
        <Switch value={!!data?.push} onValueChange={(v) => toggle('push', v)} />
      </View>

      <View className="flex-row justify-between items-center py-3 border-b">
        <View><Text className="text-base font-medium">Email Notifications</Text><Text className="text-sm text-[#876d64]">News & updates</Text></View>
        <Switch value={!!data?.email} onValueChange={(v) => toggle('email', v)} />
      </View>

      <View className="flex-row justify-between items-center py-3 border-b">
        <View><Text className="text-base font-medium">SMS Notifications</Text><Text className="text-sm text-[#876d64]">Order updates</Text></View>
        <Switch value={!!data?.sms} onValueChange={(v) => toggle('sms', v)} />
      </View>
    </ScrollView>
  );
}
