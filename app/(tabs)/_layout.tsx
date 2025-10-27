// app/(tabs)/_layout.js
import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Search, PlusSquare, Heart, User, ChartColumnStackedIcon, ListOrdered, Badge, ShoppingBasket, MessageCircle } from 'lucide-react-native';
import { useUser } from '../../hooks/userContextProvider';

export default function TabsLayout() {
  const { role } = useUser();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#171311',
        tabBarInactiveTintColor: '#876d64',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1, 
          borderTopColor: '#f4f1f0',
          paddingBottom: 8,
          paddingTop: 4,
          height: 60,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => <Home color={color} fill={color} />,
        }}
      />
      <Tabs.Screen 
        name="sellerDashboard"
        options={{
          tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => <ChartColumnStackedIcon color={color} />,
          href: (role != 'seller') ? null : undefined,
        }}
      /> 
      <Tabs.Screen 
        name="cart"
        options={{
          tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => <ShoppingBasket color={color} />,
          href: (role != 'buyer') ? null : undefined,
        }}
      /> 
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => <MessageCircle color={color} />,
        }}
      />
      <Tabs.Screen 
        name="buyerOrders"
        options={{
          tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => <ListOrdered color={color} />,
          href: (role != 'buyer') ? null : undefined, 
        }}
      /> 
      <Tabs.Screen 
        name="sellerOrders"
        options={{
          tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => <ListOrdered color={color} />,
          href: (role != 'seller') ? null : undefined,
        }}
      /> 
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => <User color={color} />,
        }}
      />
    </Tabs>
  );
}
