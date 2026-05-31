// screens/NotificationsScreen.tsx
import React from 'react';
import { View, Text, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { useRouter } from 'expo-router';
import { useNotifications, useUpdateNotifications } from '../../hooks/useNotification';
import { useTheme } from '../../components/themeProvider';

export default function NotificationsScreen() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { data, isLoading } = useNotifications();
  const update = useUpdateNotifications();
  const isUpdating = update.isPending;
  const settings = data ?? { push: true, email: false, sms: true };

  const toggle = (k: 'push' | 'email' | 'sms', val: boolean) => {
    if (isUpdating) return;
    update.mutate({ ...settings, [k]: val }, {
      onError(e) { Alert.alert('Failed', (e as any).message || 'Could not update'); }
    });
  };

  const nav = useRouter();

  if (isLoading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
        <ScreenHeader title="Notifications" onBack={() => nav.back()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color={isDark ? "#f0f1f2" : "#000000"} />
          <Text className={`font-inter text-sm mt-3 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
      <ScrollView className={isDark ? "bg-[#1a1c1d]" : "bg-white"} contentContainerStyle={{ paddingBottom: 32 }}>
        <ScreenHeader title="Notifications" onBack={() => nav.back()} />
        <View className="px-6 pt-6">
          <Text className={`font-inter text-sm leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
            Decide how you want to be notified about orders, updates, and account activity.
          </Text>

          <View className={`mt-6 rounded border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
            <View className={`flex-row justify-between items-center px-4 py-4 border-b ${isDark ? "border-[#46464e]" : "border-border"}`}>
              <View className="flex-1 pr-4">
                <Text className={`text-base font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Push Notifications</Text>
                <Text className={`text-sm mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Real-time updates on your device.</Text>
              </View>
              <Switch
                value={!!settings.push}
                onValueChange={(v) => toggle('push', v)}
                disabled={isUpdating}
                trackColor={{ false: isDark ? "#46464e" : "#E4E4E7", true: "#000000" }}
                thumbColor={isDark ? "#F0F1F2" : "#FFFFFF"}
              />
            </View>

            <View className={`flex-row justify-between items-center px-4 py-4 border-b ${isDark ? "border-[#46464e]" : "border-border"}`}>
              <View className="flex-1 pr-4">
                <Text className={`text-base font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Email Notifications</Text>
                <Text className={`text-sm mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Summaries and order updates.</Text>
              </View>
              <Switch
                value={!!settings.email}
                onValueChange={(v) => toggle('email', v)}
                disabled={isUpdating}
                trackColor={{ false: isDark ? "#46464e" : "#E4E4E7", true: "#000000" }}
                thumbColor={isDark ? "#F0F1F2" : "#FFFFFF"}
              />
            </View>

            <View className="flex-row justify-between items-center px-4 py-4">
              <View className="flex-1 pr-4">
                <Text className={`text-base font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>SMS Notifications</Text>
                <Text className={`text-sm mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Delivery and order status alerts.</Text>
              </View>
              <Switch
                value={!!settings.sms}
                onValueChange={(v) => toggle('sms', v)}
                disabled={isUpdating}
                trackColor={{ false: isDark ? "#46464e" : "#E4E4E7", true: "#000000" }}
                thumbColor={isDark ? "#F0F1F2" : "#FFFFFF"}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
