// screens/AccountInfoScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useUser } from '../../hooks/userContextProvider';
import { request } from "../../services/api";
import { z } from 'zod';

const BuyerSchema = z.object({
  buyername: z.string().min(2).max(60).optional(),
  shipping_address: z.any().optional(),
});

const SellerSchema = z.object({
  shop_name: z.string().min(2).optional(),
  description: z.string().optional(),
  category_ids: z.array(z.number()).optional(),
});

export default function AccountInfoScreen() {
  const { user, setUser } = useUser();
  const [phone, setPhone] = useState('');
  const [buyername, setBuyername] = useState('');
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
        //work on these later
      //setPhone(user.phone_number || '');
      //setBuyername(user.account_type == 'buyer' ? user.buyername : '');
      //setShopName(user.account_type == 'seller' ? user.shopname || '');
      //setDescription(user.seller_account?.description || '');
    }
  }, [user]);

  const handleSave = async (url: string, payload: any, schema?: any) => {
    if (schema) {
      const parsed = schema.safeParse(payload);
      if (!parsed.success) return Alert.alert('Validation', parsed.error.issues[0].message);
    }

    try {
      setLoading(true);
      const updated = await request(url, { method: 'PATCH', body: JSON.stringify(payload) });
      setUser(updated); // update context
      Alert.alert('Success', 'Profile updated');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-lg font-bold mb-2">General</Text>
      <TextInput
        placeholder="Phone Number"
        className="border border-gray-200 rounded p-3 mb-4"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TouchableOpacity
        className="bg-[#e26136] rounded h-12 items-center justify-center mb-6"
        onPress={() => handleSave('/users/profile', { phone_number: phone })}
        disabled={loading}
      >
        <Text className="text-white font-bold">{loading ? 'Saving...' : 'Save General Info'}</Text>
      </TouchableOpacity>

      <Text className="text-lg font-bold mb-2">Buyer</Text>
      <TextInput
        placeholder="Buyer Name"
        className="border border-gray-200 rounded p-3 mb-4"
        value={buyername}
        onChangeText={setBuyername}
      />
      <TouchableOpacity
        className="bg-[#e26136] rounded h-12 items-center justify-center mb-6"
        onPress={() => handleSave('/users/profile/buyer', { buyername }, BuyerSchema)}
        disabled={loading}
      >
        <Text className="text-white font-bold">{loading ? 'Saving...' : 'Save Buyer Info'}</Text>
      </TouchableOpacity>

      <Text className="text-lg font-bold mb-2">Seller</Text>
      <TextInput
        placeholder="Shop Name"
        className="border border-gray-200 rounded p-3 mb-4"
        value={shopName}
        onChangeText={setShopName}
      />
      <TextInput
        placeholder="Description"
        className="border border-gray-200 rounded p-3 mb-4"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TouchableOpacity
        className="bg-[#e26136] rounded h-12 items-center justify-center mb-6"
        onPress={() => handleSave('/users/profile/seller', { shop_name: shopName, description }, SellerSchema)}
        disabled={loading}
      >
        <Text className="text-white font-bold">{loading ? 'Saving...' : 'Save Seller Info'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
