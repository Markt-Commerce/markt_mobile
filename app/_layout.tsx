// app/_layout.tsx
import { Stack } from "expo-router";
import "../global.css";
import { UserProvider, useUser, UserContextType } from "../hooks/userContextProvider";
import { RegisterProvider } from "../models/signupSteps";
import { ToastProvider } from "../components/ToastProvider";
import { ThemeProvider} from "../components/themeProvider";
import { useState } from "react";
import { RegisterRequest } from "../models/auth";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
//import * as SecureStore from 'expo-secure-store';
import React from "react";

export default function RootLayout() {
  // Temporary regData state until you move this into entrances/_layout.tsx
  const [regData, setRegData] = useState<RegisterRequest>({
    email: "",
    password: "",
    username: "",
    account_type: "buyer",
    phone_number: "",
    buyer_data: {} as RegisterRequest["buyer_data"],
    seller_data: {} as RegisterRequest["seller_data"],
  });


  // Persist user session on app load
  // Firstly, check if there is a stored user information in SecureStore
  return (
    <ThemeProvider>
    <ToastProvider>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
        <RegisterProvider value={{ regData, setRegData }}>
          <AppStack />
        </RegisterProvider>
      </UserProvider>
    </GestureHandlerRootView>
    </ToastProvider>
    </ThemeProvider>
  );
}

export function AppStack() {
  //get the user from secure store and set it to the user context
  //const userData:UserAuthType = JSON.parse(await SecureStore.getItemAsync('user') || 'null') as UserAuthType;
  
  const user: UserContextType | null = useUser();

  if (user.user == null) {
    return <Stack screenOptions={{ headerShown: false }} initialRouteName="introduction" />;
  }



  //const loggedIn = await loginUser({email: userData.email, password: userData.password, account_type: userData.userType});
  /* if (!loggedIn) {
    return <Stack screenOptions={{ headerShown: false }} initialRouteName="entrances/login" />;
  } */

  
  //store user in context
  //SecureStore.setItemAsync('user', JSON.stringify(userData));
  return (
    <Stack  screenOptions={{ headerShown: false }} />
    );
}
