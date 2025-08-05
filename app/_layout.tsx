// app/_layout.js
import { Stack } from 'expo-router';
import "../global.css"
import { UserProvider, useUser, UserContextType } from '../models/userContextProvider';

export default function RootLayout() {
  return (
    <UserProvider>
      <AppStack />
    </UserProvider>
  );
}

export function AppStack() {

  const user: UserContextType | null = useUser()

  if (user.user === null) {
    return <Stack screenOptions={{ headerShown: false }} initialRouteName="introduction" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
