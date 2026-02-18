// app/(tabs)/_layout.js
import React from 'react';
import { Tabs } from 'expo-router';
import { Home, ChartColumnStackedIcon, ShoppingBasket, MessageCircle, ListOrdered, User } from 'lucide-react-native';
import { useUser } from '../../hooks/userContextProvider';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const { role } = useUser();
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarActiveTintColor: '#171311',
        tabBarInactiveTintColor: '#876d64',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#efe9e7',
          paddingBottom: 8,
          paddingTop: 6,
          height: 64,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home color={color} fill={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="sellerDashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <ChartColumnStackedIcon color={color} size={22} />,
          href: role !== 'seller' ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => <ShoppingBasket color={color} size={22} />,
          href: role !== 'buyer' ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <MessageCircle color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="buyerOrders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <ListOrdered color={color} size={22} />,
          href: role !== 'buyer' ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="sellerOrders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <ListOrdered color={color} size={22} />,
          href: role !== 'seller' ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User color={color} size={22} />,
        }}
      />
    </Tabs>
    </SafeAreaView>
  );
}
