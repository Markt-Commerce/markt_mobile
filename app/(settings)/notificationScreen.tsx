// screens/NotificationsScreen.tsx
import React from 'react';
import { View, Text, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { useRouter } from 'expo-router';
import { useNotifications, useUpdateNotifications } from '../../hooks/useNotification';
import { useTheme } from '../../components/themeProvider';
import { friendlyErrorMessage } from '../../utils/errorMessages';
import { useTokens } from '../../theme/useTokens';

export default function NotificationsScreen() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const t = useTokens();
  const { data, isLoading } = useNotifications();
  const update = useUpdateNotifications();
  const isUpdating = update.isPending;
  const settings = data ?? { push: true, email: false, sms: true };

  const toggle = (k: 'push' | 'email' | 'sms', val: boolean) => {
    if (isUpdating) return;
    update.mutate({ ...settings, [k]: val }, {
      onError(e) { Alert.alert('Failed', friendlyErrorMessage(e, 'Could not update your notification settings.')); }
    });
  };

  const nav = useRouter();

  if (isLoading) {
    return (
      <SafeAreaView className={`flex-1 bg-surface-raised`}>
        <ScreenHeader title="Notifications" onBack={() => nav.back()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color={t.textPrimary} />
          <Text className={`text-sm mt-3 text-text-secondary`}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 bg-surface-raised`}>
      <ScrollView className={isDark ? "bg-surface-raised" : "bg-white"} contentContainerStyle={{ paddingBottom: 32 }}>
        <ScreenHeader title="Notifications" onBack={() => nav.back()} />
        <View className="px-6 pt-6">
          <Text className={`text-sm leading-6 text-text-secondary`}>
            Decide how you want to be notified about orders, updates, and account activity.
          </Text>

          <View className={`mt-6 rounded border ${isDark ? "bg-surface-raised border-border-strong" : "bg-white border-border"}`}>
            <View className={`flex-row justify-between items-center px-4 py-4 border-b border-border-strong`}>
              <View className="flex-1 pr-4">
                <Text className={`text-base font-bold text-text-primary`}>Push Notifications</Text>
                <Text className={`text-sm mt-1 text-text-secondary`}>Real-time updates on your device.</Text>
              </View>
              <Switch
                value={!!settings.push}
                onValueChange={(v) => toggle('push', v)}
                disabled={isUpdating}
                trackColor={{ false: t.borderStrong, true: "#000000" }}
                thumbColor={isDark ? "#F0F1F2" : "#FFFFFF"}
              />
            </View>

            <View className={`flex-row justify-between items-center px-4 py-4 border-b border-border-strong`}>
              <View className="flex-1 pr-4">
                <Text className={`text-base font-bold text-text-primary`}>Email Notifications</Text>
                <Text className={`text-sm mt-1 text-text-secondary`}>Summaries and order updates.</Text>
              </View>
              <Switch
                value={!!settings.email}
                onValueChange={(v) => toggle('email', v)}
                disabled={isUpdating}
                trackColor={{ false: t.borderStrong, true: "#000000" }}
                thumbColor={isDark ? "#F0F1F2" : "#FFFFFF"}
              />
            </View>

            <View className="flex-row justify-between items-center px-4 py-4">
              <View className="flex-1 pr-4">
                <Text className={`text-base font-bold text-text-primary`}>SMS Notifications</Text>
                <Text className={`text-sm mt-1 text-text-secondary`}>Delivery and order status alerts.</Text>
              </View>
              <Switch
                value={!!settings.sms}
                onValueChange={(v) => toggle('sms', v)}
                disabled={isUpdating}
                trackColor={{ false: t.borderStrong, true: "#000000" }}
                thumbColor={isDark ? "#F0F1F2" : "#FFFFFF"}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
