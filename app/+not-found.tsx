import { Text, View } from 'react-native';
import { Unlink } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react'

const notfound = () => {
  return (
    <SafeAreaView className='flex-1 bg-white'>
      <View className='flex-1 justify-center items-center gap-4 px-4'>
        <Unlink size={48} color="#171311" />
        <Text className='text-center #text-[#171311] font-bold text-[2rem]'>Route Not Found</Text>
        <Text className='text-center #text-[#171311]'>It seems you have lost your steps and are disconnected from the link. Tap the back button to retrace your steps.</Text>
      </View>
    </SafeAreaView>
  )
}

export default notfound
