// app/_layout.tsx
import { Stack } from "expo-router";
import "../global.css";
import { UserProvider, useUser, UserContextType } from "../models/userContextProvider";
import { RegisterProvider } from "../models/signupSteps";
import { useState } from "react";
import type { RegisterRequest } from "../models/auth";

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

  return (
    <UserProvider>
      <RegisterProvider value={{ regData, setRegData }}>
        <AppStack />
      </RegisterProvider>
    </UserProvider>
  );
}

export function AppStack() {
  const user: UserContextType | null = useUser();

  if (user.user === null) {
    return <Stack screenOptions={{ headerShown: false }} initialRouteName="introduction" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}

