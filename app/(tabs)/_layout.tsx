// app/(tabs)/_layout.js
import { Tabs } from 'expo-router';
import { Home, Search, PlusSquare, Heart, User, ChartColumnStackedIcon, SquareStack, ListStartIcon } from 'lucide-react-native';

export default function TabsLayout() {
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
          tabBarIcon: ({ color, size, focused }) => <Home color={color} fill={color} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          tabBarIcon: ({ color, size, focused }) => <Search color={color} />,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          tabBarIcon: ({ color, size, focused }) => <PlusSquare  color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ color, size, focused }) => <Heart color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size, focused }) => <User color={color} />,
        }}
      />
      <Tabs.Screen 
        name="listings"
        options={{
          tabBarIcon: ({ color, size, focused }) => <ListStartIcon color={color} />,
        }}
      />
      <Tabs.Screen 
        name="sellerDashboard"
        options={{
          tabBarIcon: ({ color, size, focused }) => <ChartColumnStackedIcon color={color} />,
        }}
      />
      <Tabs.Screen 
        name="catalog"
        options={{
          tabBarIcon: ({ color, size, focused }) => <SquareStack color={color} />,
        }}
      />
    </Tabs>
  );
}
