import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
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

export default function SettingsProfileScreen() {
  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center p-4 pb-2 justify-between">
        <ArrowLeft size={24} color="#171311" />
        <Text className="flex-1 text-center pr-12 text-lg font-bold text-[#171311]">
          Profile & Settings
        </Text>
      </View>

      {/* Profile Section */}
      <View className="items-center py-6">
        <Image
          source={{
            uri: "https://via.placeholder.com/150",
          }}
          className="w-32 h-32 rounded-full"
        />
        <Text className="text-[22px] font-bold text-[#171311] mt-3">
          Sophia Carter
        </Text>
        <Text className="text-base text-[#876d64]">@sophia.carter</Text>
        <Text className="text-base text-[#876d64]">Joined 2021</Text>
      </View>

      {/* Profile Details */}
      <Text className="px-4 pb-2 pt-4 text-lg font-bold text-[#171311]">
        Details
      </Text>
      {[
        { label: "Name", value: "Sophia Carter" },
        { label: "Username", value: "@sophia.carter" },
        { label: "Gender", value: "Female" },
        { label: "Location", value: "Los Angeles, CA" },
        { label: "Joined", value: "2021" },
      ].map((item, i) => (
        <TouchableOpacity
          key={i}
          className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100"
        >
          <View>
            <Text className="text-base font-medium text-[#171311]">
              {item.label}
            </Text>
            <Text className="text-sm text-[#876d64]">{item.value}</Text>
          </View>
          <ArrowRight size={20} color="#171311" />
        </TouchableOpacity>
      ))}

      {/* App Preferences */}
      <Text className="px-4 pb-2 pt-4 text-lg font-bold text-[#171311]">
        App Preferences
      </Text>
      {[
        {
          label: "Notifications",
          desc: "Enable or disable notifications",
          icon: Bell,
        },
        {
          label: "Appearance",
          desc: "Customize app theme",
          icon: Sun,
        },
        {
          label: "Language",
          desc: "Manage language preferences",
          icon: Globe,
        },
      ].map((item, i) => (
        <TouchableOpacity
          key={i}
          className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100"
        >
          <View className="flex-row items-center gap-3">
            <View className="bg-[#f4f1f0] p-2 rounded-lg">
              <item.icon size={20} color="#171311" />
            </View>
            <View>
              <Text className="text-base font-medium text-[#171311]">
                {item.label}
              </Text>
              <Text className="text-sm text-[#876d64]">{item.desc}</Text>
            </View>
          </View>
          <ArrowRight size={20} color="#171311" />
        </TouchableOpacity>
      ))}

      {/* Account Management */}
      <Text className="px-4 pb-2 pt-4 text-lg font-bold text-[#171311]">
        Account Management
      </Text>
      {[
        { label: "Account Information", icon: User },
        { label: "Change Password", icon: Lock },
        { label: "Payment Methods", icon: CreditCard },
        { label: "Shipping Addresses", icon: Truck },
        { label: "Linked Accounts", icon: LinkIcon },
      ].map((item, i) => (
        <TouchableOpacity
          key={i}
          className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100"
        >
          <View className="flex-row items-center gap-3">
            <View className="bg-[#f4f1f0] p-2 rounded-lg">
              <item.icon size={20} color="#171311" />
            </View>
            <Text className="text-base font-medium text-[#171311]">
              {item.label}
            </Text>
          </View>
          <ArrowRight size={20} color="#171311" />
        </TouchableOpacity>
      ))}

      {/* Support & Info */}
      <Text className="px-4 pb-2 pt-4 text-lg font-bold text-[#171311]">
        Support & Information
      </Text>
      {[
        { label: "Help Center", icon: Question },
        { label: "Terms of Service", icon: FileText },
        { label: "Privacy Policy", icon: ShieldCheck },
        { label: "About", icon: Info },
      ].map((item, i) => (
        <TouchableOpacity
          key={i}
          className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100"
        >
          <View className="flex-row items-center gap-3">
            <View className="bg-[#f4f1f0] p-2 rounded-lg">
              <item.icon size={20} color="#171311" />
            </View>
            <Text className="text-base font-medium text-[#171311]">
              {item.label}
            </Text>
          </View>
          <ArrowRight size={20} color="#171311" />
        </TouchableOpacity>
      ))}

      {/* Logout Button */}
      <View className="px-4 py-5">
        <TouchableOpacity className="bg-[#f4f1f0] h-10 rounded-full justify-center items-center">
          <Text className="text-[#171311] font-bold">Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
