import { TextInput, View, Text } from "react-native";
import { Control, Controller, FieldErrors, FieldValues } from "react-hook-form";

interface InputProps extends React.ComponentProps<typeof TextInput> {
  placeholder: string;
  secureTextEntry?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  errors?: any;//change this later to a FieldErrors<FieldValues>;
  control: Control<FieldValues>;
}

export function Input({
  placeholder,
  secureTextEntry = false,
  value,
  onChangeText,
  errors,
  control
}: InputProps) {
  return (
    <View className="flex flex-wrap items-end gap-4 py-3">
        {errors.password && <Text className="text-[#e9242a] text-sm font-normal">{errors.password.message}</Text>}
          <Controller control={control} name="password" render={({ field: { onChange, onBlur, value }})=>{
            return (
              <TextInput
                onChange={onChange}
                onBlur={onBlur}
                value={value}
                placeholder={placeholder}
                placeholderTextColor="#826869"
                secureTextEntry
                className="form-input w-full rounded-xl text-[#171212] bg-[#f4f1f1] h-14 px-4 text-base font-normal"
              />
            );
          }} />
        </View>
  );
}