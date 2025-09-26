import { Button, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { Input } from '../../components/inputs';
import { z } from 'zod';
import { useController, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sendPasswordResetEmail, resetPassword } from '../../services/sections/auth';
import { useRouter } from 'expo-router';

const forgotPassword = () => {

  const [emailInitiationStarted, setEmailInitiationStarted] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const router = useRouter();

  const schema = z.object({
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    code: z.string().min(6, "Code must be 6 characters").max(6, "Code must be 6 characters"),
    newPassword: z.string().min(8, "Password must be at least 8 characters").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
    confirmNewPassword: z.string().min(8, "Please confirm your new password"),
  }).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"]
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange"
  });

  const getPasswordVerificationCode = async () => {
    //send email to backend to get verification code
    try {
      setEmailInitiationStarted(true);
      const response = await sendPasswordResetEmail(control._formValues.email);
      //simulate email being sent
      setTimeout(() => {
        setEmailSent(true);
      }, 2000);
    } catch (error) {
      console.error("Error sending password reset email:", error);
    }
  }

  const onSubmit = async (data: z.infer<typeof schema>) => {
    //send code and new password to backend to reset password
    try {
      const result = await resetPassword(data.email, data.code || "", data.newPassword || "");
      if (result) {
        console.log("Password reset successful");
        router.push("/login");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
    }
  }

  return (
    <View className="flex-1 bg-white justify-center items-center px-4">
      <View className="w-full max-w-[480px]">
        <Text className="text-[#171212] text-[28px] font-bold leading-tight text-center pb-3 pt-5">
          Forgot Password
        </Text>
        <Input placeholder="Email" control={control} name="email" errors={errors} />
        { emailInitiationStarted && !emailSent && <Text className="text-[#826869] text-sm font-normal text-center pb-3 pt-1">
          Sending verification code to your email...
        </Text>}
        { emailSent && <Text className="text-[#34A853] text-sm font-normal text-center pb-3 pt-1">
          Verification code sent! Please check your email.
        </Text>}
        <Button title={ emailSent ? "Resend Code" : "Send Verification Code"} onPress={getPasswordVerificationCode} disabled={ (emailInitiationStarted && !emailSent)} />
        <Input placeholder="Verification Code" control={control} name="code" errors={errors} />
        <Input placeholder="New Password" control={control} name="newPassword" errors={errors} secureTextEntry={true} />
        <Input placeholder="Confirm New Password" control={control} name="confirmNewPassword" errors={errors} secureTextEntry={true} />
        <Button title="Reset Password" onPress={handleSubmit(onSubmit)} disabled={!isValid || !emailSent} />
      </View>
    </View>
  )
}


export default forgotPassword

const styles = StyleSheet.create({})