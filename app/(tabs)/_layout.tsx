// app/(tabs)/_layout.js
import { Tabs } from 'expo-router';
import { Home, Search, PlusSquare, Heart, User, ChartColumnStackedIcon, SquareStack, ListStartIcon, Badge } from 'lucide-react-native';
import { useUser } from '../../models/userContextProvider';

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
          tabBarIcon: ({ color, size, focused }) => <Home color={color} fill={color} />,
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
          href: (role != 'seller') ? null : undefined, // Hide this tab if the user is not a seller
        }}
      />
      <Tabs.Screen 
        name="sellerDashboard"
        options={{
          tabBarIcon: ({ color, size, focused }) => <ChartColumnStackedIcon color={color} />,
          href: (role != 'seller') ? null : undefined, // Hide this tab if the user is not a seller
        }}
      /> 
      <Tabs.Screen 
        name="buyerRequests"
        options={{
          tabBarIcon: ({ color, size, focused }) => <SquareStack color={color} />,
          href: (role != 'seller') ? null : undefined, // Hide this tab if the user is not a seller
        }}
      />
      <Tabs.Screen 
        name="shop"
        options={{
          tabBarIcon: ({ color, size, focused }) => <Badge color={color} />,
        }}
      />
    </Tabs>
  );
}

//seller: feed, orders, profile,
//buyer: feed, orders, profile, 

//seller top tab: post, chat, shop
//buyer top tab: post, cart, chat