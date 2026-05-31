import { Text, View } from 'react-native';
import { Unlink } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react'
import { useTheme } from '../components/themeProvider';

const notfound = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }}>
      <View className='flex-1 justify-center items-center gap-4 px-4'>
        <Unlink size={48} color={isDark ? "#f0f1f2" : "#000000"} />
        <Text className={`text-center font-bold text-[2rem] ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Route Not Found</Text>
        <Text className={`text-center ${isDark ? "text-[#c6c5cf]" : "text-[#000000]"}`}>It seems you have lost your steps and are disconnected from the link. Tap the back button to retrace your steps.</Text>
      </View>
    </SafeAreaView>
  )
}

export default notfound
