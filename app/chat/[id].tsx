import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import { useLocalSearchParams } from "expo-router";
import ChatScreen from "../../components/chat";
import { useTheme } from "../../components/themeProvider";

export default function Chat() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const { id, username, profilePicture } = useLocalSearchParams<{
    id: string;
    username?: string;
    profilePicture?: string;
  }>();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#0b0b0c" : "#FFFFFF" }}
    >
      <ChatScreen
        route={{
          params: {
            roomId: Number(id as string),
            otherUser: username
              ? { username, profile_picture: profilePicture ?? undefined }
              : undefined,
          },
        }}
        navigation={undefined as unknown as any}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
