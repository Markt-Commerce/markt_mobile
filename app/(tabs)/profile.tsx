import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Switch } from "react-native";
import {
  ArrowLeft,
  Bell,
  Sun,
  Globe,
  User,
  Lock,
  CreditCard,
  Truck,
  Link as LinkIcon,
  HelpCircle as Question,
  FileText,
  ShieldCheck,
  Info,
  ArrowRight,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function SettingsProfileScreen() {
  const nav = useRouter();
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [appearance, setAppearance] = useState<"light" | "dark">("light");
  const [language, setLanguage] = useState<"EN" | "FR">("EN");

  // Small helpers
  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View className="w-full max-w-[640px] self-center px-4">
      <Text className="px-1 pt-6 pb-2 text-xs font-semibold uppercase tracking-wider text-[#8e7a74]">
        {title}
      </Text>
      <View className="rounded-2xl border border-[#efe9e7] bg-white overflow-hidden">{children}</View>
    </View>
  );

  const Row: React.FC<{
    children: React.ReactNode;
    onPress?: () => void;
    showChevron?: boolean;
    last?: boolean;
    trailing?: React.ReactNode;
  }> = ({ children, onPress, showChevron, last, trailing }) => {
    const Comp = onPress ? TouchableOpacity : View;
    return (
      <Comp
        onPress={onPress as any}
        activeOpacity={0.7}
        className={`flex-row items-center justify-between px-4 py-4 ${last ? "" : "border-b border-[#f3efed]"}`}
      >
        <View className="flex-row items-center gap-3">{children}</View>
        <View className="flex-row items-center gap-2">
          {trailing}
          {showChevron ? <ArrowRight size={18} color="#7a6963" /> : null}
        </View>
      </Comp>
    );
  };

  const Pill: React.FC<{ active?: boolean; label: string; onPress?: () => void; className?: string }> = ({
    active,
    label,
    onPress,
    className,
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`px-3 py-1.5 rounded-full ${active ? "bg-[#e26136]" : "bg-[#f5f2f1]"} ${className ?? ""}`}
    >
      <Text className={active ? "text-white" : "text-[#171311]"}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center p-4 pb-2 justify-between">
          <TouchableOpacity onPress={() => nav.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ArrowLeft size={24} color="#171311" />
          </TouchableOpacity>
          <Text className="flex-1 text-center pr-12 text-lg font-bold text-[#171311]">
            Profile & Settings
          </Text>
        </View>

        {/* Profile */}
        <View className="w-full max-w-[640px] self-center px-4">
          <View className="items-center rounded-2xl border border-[#efe9e7] bg-white px-5 py-6">
            <Image
              source={{
                uri:
                  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=80&crop=faces,entropy",
              }}
              className="w-28 h-28 rounded-full"
            />
            <Text className="text-[20px] font-bold text-[#171311] mt-3">Sophia Carter</Text>
            <Text className="text-sm text-[#876d64]">@sophia.carter</Text>
            <Text className="text-sm text-[#876d64]">Joined 2021</Text>
          </View>
        </View>

        {/* Details */}
        <Section title="Details">
          {[
            { label: "Name", value: "Sophia Carter", pressable: true },
            { label: "Username", value: "@sophia.carter", pressable: true },
            { label: "Gender", value: "Female", pressable: true },
            { label: "Location", value: "Los Angeles, CA", pressable: true },
            { label: "Joined", value: "2021", pressable: false },
          ].map((item, i, arr) => (
            <Row
              key={i}
              onPress={item.pressable ? () => {} : undefined}
              showChevron={!!item.pressable}
              last={i === arr.length - 1}
            >
              <View>
                <Text className="text-base font-medium text-[#171311]">{item.label}</Text>
                <Text className="text-sm text-[#876d64]">{item.value}</Text>
              </View>
            </Row>
          ))}
        </Section>

        {/* App Preferences */}
        <Section title="App Preferences">
          <Row
            trailing={
              <Switch
                value={notificationsOn}
                onValueChange={setNotificationsOn}
                thumbColor={notificationsOn ? "#ffffff" : "#ffffff"}
                trackColor={{ false: "#d8d1ce", true: "#e26136" }}
              />
            }
          >
            <View className="bg-[#f4f1f0] p-2 rounded-lg">
              <Bell size={20} color="#171311" />
            </View>
            <View>
              <Text className="text-base font-medium text-[#171311]">Notifications</Text>
              <Text className="text-sm text-[#876d64]">Enable or disable notifications</Text>
            </View>
          </Row>

          {/* Appearance: segmented pills (no chevron) */}
          <Row
            trailing={
              <View className="flex-row items-center bg-[#f5f2f1] rounded-full p-1">
                <Pill
                  label="Light"
                  active={appearance === "light"}
                  onPress={() => setAppearance("light")}
                />
                <Pill
                  label="Dark"
                  active={appearance === "dark"}
                  onPress={() => setAppearance("dark")}
                  className="ml-1"
                />
              </View>
            }
          >
            <View className="bg-[#f4f1f0] p-2 rounded-lg">
              <Sun size={20} color="#171311" />
            </View>
            <View>
              <Text className="text-base font-medium text-[#171311]">Appearance</Text>
              <Text className="text-sm text-[#876d64]">Customize app theme</Text>
            </View>
          </Row>

          {/* Language: segmented pills (no chevron) */}
          <Row
            last
            trailing={
              <View className="flex-row items-center bg-[#f5f2f1] rounded-full p-1">
                <Pill label="EN" active={language === "EN"} onPress={() => setLanguage("EN")} />
                <Pill label="FR" active={language === "FR"} onPress={() => setLanguage("FR")} className="ml-1" />
              </View>
            }
          >
            <View className="bg-[#f4f1f0] p-2 rounded-lg">
              <Globe size={20} color="#171311" />
            </View>
            <View>
              <Text className="text-base font-medium text-[#171311]">Language</Text>
              <Text className="text-sm text-[#876d64]">Manage language preferences</Text>
            </View>
          </Row>
        </Section>

        {/* Account Management (actionable → chevrons kept) */}
        <Section title="Account Management">
          {[
            { label: "Account Information", icon: User },
            { label: "Change Password", icon: Lock },
            { label: "Payment Methods", icon: CreditCard },
            { label: "Shipping Addresses", icon: Truck },
            { label: "Linked Accounts", icon: LinkIcon },
          ].map((item, i, arr) => {
            const Icon = item.icon;
            return (
              <Row key={i} onPress={() => {}} showChevron last={i === arr.length - 1}>
                <View className="bg-[#f4f1f0] p-2 rounded-lg">
                  <Icon size={20} color="#171311" />
                </View>
                <Text className="text-base font-medium text-[#171311]">{item.label}</Text>
              </Row>
            );
          })}
        </Section>

        {/* Support & Information (actionable → chevrons kept) */}
        <Section title="Support & Information">
          {[
            { label: "Help Center", icon: Question },
            { label: "Terms of Service", icon: FileText },
            { label: "Privacy Policy", icon: ShieldCheck },
            { label: "About", icon: Info },
          ].map((item, i, arr) => {
            const Icon = item.icon;
            return (
              <Row key={i} onPress={() => {}} showChevron last={i === arr.length - 1}>
                <View className="bg-[#f4f1f0] p-2 rounded-lg">
                  <Icon size={20} color="#171311" />
                </View>
                <Text className="text-base font-medium text-[#171311]">{item.label}</Text>
              </Row>
            );
          })}
        </Section>

        {/* Logout */}
        <View className="w-full max-w-[640px] self-center px-4 pt-4 pb-6">
          <TouchableOpacity className="bg-[#f4f1f0] h-11 rounded-full justify-center items-center" activeOpacity={0.85}>
            <Text className="text-[#171311] font-semibold">Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
