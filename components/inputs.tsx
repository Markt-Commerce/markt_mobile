import { TextInput, View, Text } from "react-native";
import { Control, Controller, ControllerProps, FieldErrors, FieldValues } from "react-hook-form";

interface InputProps extends React.ComponentProps<typeof TextInput> {
  name?: string; // made optional to allow for more flexible usage
  placeholder: string;
  secureTextEntry?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  errors?: any;// will change this later to a FieldErrors<FieldValues> or something related to the form type
  control: Control<any>;// will change this later as well to a partial of signup form type
}

export function Input({
  name,
  placeholder,
  secureTextEntry = false,
  value,
  onChangeText,
  errors,
  control
}: InputProps) {
  return (
    <View className="flex flex-wrap items-end gap-2 py-3">
          <Controller control={control} name={name!} render={({ field: { onChange, onBlur, value }})=>{
            return (
              <TextInput
                onChange={onChange}
                onBlur={onBlur}
                value={value}
                placeholder={placeholder}
                placeholderTextColor="#826869"
                secureTextEntry={secureTextEntry}
                className="form-input w-full rounded-xl text-[#171212] bg-[#f4f1f1] h-14 px-4 text-base font-normal"
              />
            );
          }} />
        </View>
  );
}