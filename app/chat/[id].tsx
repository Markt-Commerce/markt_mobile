import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import ChatScreen from '../../components/chat'

export default function chat() {

  const { id } = useLocalSearchParams();
  return (
    <View style={{flex:1}}>
      <ChatScreen route={{params: {
        roomId: Number(id as string)
      }}}
      navigation={undefined as unknown as any}
      />
    </View>
  )
}

const styles = StyleSheet.create({})