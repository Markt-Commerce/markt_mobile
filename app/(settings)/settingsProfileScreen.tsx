// screens/SettingsProfileScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { ArrowLeft, ArrowRight, Bell, Sun, Globe, User, Lock, CreditCard, Truck, HelpCircle as Question, FileText, ShieldCheck, Info } from 'lucide-react-native';
import { useUser } from '../../hooks/userContextProvider';
import { request } from '../../services/api';
import { useTheme } from '../../hooks/themeContext';
import { useRouter, Link } from 'expo-router';	

export default function SettingsProfileScreen() {
  const { user, setUser } = useUser();
  const { theme, setTheme, language, setLanguage } = useTheme();
  const nav = useRouter();
  const [notif, setNotif] = useState({ push: true, email: false, sms: true }); // mock

  const handleLogout = async () => {
    try {
      await request('/users/logout', { method: 'POST' });
      setUser(null);
      nav.push('/(entrances)/login');
    } catch (err: any) {
      Alert.alert('Logout Failed', err.message || 'Try again');
    }
  };


  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center p-4 pb-2 justify-between">
        <TouchableOpacity onPress={() => nav.back()}>
          <ArrowLeft size={24} color="#171311" />
        </TouchableOpacity>
        <Text className="flex-1 text-center pr-12 text-lg font-bold text-[#171311]">Profile & Settings</Text>
      </View>

      {/* Profile Info */}
      <View className="items-center py-6">
        {/*  
        Original code to use actual user data when available
        <Image source={{ uri: user?.profile_picture_url || 'https://via.placeholder.com/150' }} className="w-32 h-32 rounded-full" />
        <Text className="text-[22px] font-bold text-[#171311] mt-3">{user?.username || 'Your Name'}</Text>
        */}
        <Image source={{ uri: 'https://via.placeholder.com/150' }} className="w-32 h-32 rounded-full" />
        <Text className="text-[22px] font-bold text-[#171311] mt-3">{ 'Your Name'}</Text>
        <Text className="text-base text-[#876d64]">{user?.email}</Text>
      </View>

      {/* Theme & Language */}
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100">
        <Text className="text-base font-medium">Theme: {theme}</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={() => setTheme('light')} className={`px-3 py-1 rounded ${theme === 'light' ? 'bg-[#e26136]' : 'bg-[#f4f1f0]'}`}>
            <Text className={`${theme === 'light' ? 'text-white' : 'text-[#171311]'}`}>Light</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTheme('dark')} className={`px-3 py-1 rounded ${theme === 'dark' ? 'bg-[#e26136]' : 'bg-[#f4f1f0]'}`}>
            <Text className={`${theme === 'dark' ? 'text-white' : 'text-[#171311]'}`}>Dark</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100">
        <Text className="text-base font-medium">Language: {language}</Text>
        <View className="flex-row">
          <TouchableOpacity onPress={() => setLanguage('en')} className={`px-3 py-1 rounded ${language === 'en' ? 'bg-[#e26136]' : 'bg-[#f4f1f0]'}`}>
            <Text className={`${language === 'en' ? 'text-white' : 'text-[#171311]'}`}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setLanguage('fr')} className={`px-3 py-1 rounded ml-2 ${language === 'fr' ? 'bg-[#e26136]' : 'bg-[#f4f1f0]'}`}>
            <Text className={`${language === 'fr' ? 'text-white' : 'text-[#171311]'}`}>FR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation */}
      <TouchableOpacity className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100" onPress={() => nav.navigate('AccountInfo' as never)}>
        <View className="flex-row items-center gap-3">
          <User size={20} color="#171311" />
          <Text className="text-base font-medium text-[#171311]">Account Information</Text>
        </View>
        <ArrowRight size={20} color="#171311" />
      </TouchableOpacity>

      {/* Logout */}
      <View className="px-4 py-5">
        <TouchableOpacity className="bg-[#f4f1f0] h-10 rounded-full justify-center items-center" onPress={handleLogout}>
          <Text className="text-[#171311] font-bold">Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
