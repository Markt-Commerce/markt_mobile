import { Text, View, TouchableOpacity, TouchableOpacityProps } from 'react-native'
import React from 'react'

const Button = ({
    onPress,
    disabled = false,
    text = "Next"
}:TouchableOpacityProps & {text?: string}) => {
  return (
        <View className="flex px-4 py-3">
          <TouchableOpacity className="flex h-12 items-center justify-center rounded-full bg-[#e9242a] px-5" 
          onPress={onPress}
          disabled={disabled}
          style={{
              backgroundColor: !disabled ? '#e9242a' : '#f4f1f1',
            }}
          >
            <Text className="text-white text-base font-bold tracking-[0.015em] truncate"
            style={{
              color: !disabled ? '#ffffff' : '#886364',
            }}>Next</Text>
          </TouchableOpacity>
        </View>
  )
}

export default Button
