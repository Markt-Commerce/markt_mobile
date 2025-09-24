// screens/ChangePasswordScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { usePasswordResetConfirm } from '../../hooks/useAuth';

export default function ChangePasswordScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const reset = usePasswordResetConfirm();

  const onSubmit = async () => {
    try {
      await reset.mutateAsync({ code, new_password: newPassword, email });
      Alert.alert('Success', 'Password changed');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to change password');
    }
  };

  return (
    <ScrollView className="p-4 bg-white">
      <Text className="text-base mb-2">Email</Text>
      <TextInput value={email} onChangeText={setEmail} className="border p-3 rounded mb-2" keyboardType="email-address" />

      <Text className="text-base mb-2">Code</Text>
      <TextInput value={code} onChangeText={setCode} className="border p-3 rounded mb-2" />

      <Text className="text-base mb-2">New Password</Text>
      <TextInput value={newPassword} onChangeText={setNewPassword} className="border p-3 rounded mb-4" secureTextEntry />

      <TouchableOpacity className="bg-[#e26136] h-12 rounded items-center justify-center" onPress={onSubmit}>
        <Text className="text-white font-bold">Change Password</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
