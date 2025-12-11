import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import ChatScreen from '../../components/chat'

export default function chat() {

  const { id } = useLocalSearchParams();
  return (
    <SafeAreaView style={{flex:1}}>
      <ChatScreen route={{params: {
        roomId: Number(id as string)
      }}}
      navigation={undefined as unknown as any}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({})