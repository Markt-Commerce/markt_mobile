// app/_layout.js
import { Stack } from 'expo-router';
import "../global.css"
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProvider } from '../models/userContextProvider';

export default function RootLayout() {
  return (
    <UserProvider>
      <AppStack />
    </UserProvider>
  );
}

export function AppStack() {
  if (AsyncStorage.getItem('first-timer') === null) {
    
    return <Stack screenOptions={{ headerShown: false }} initialRouteName="introduction" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
