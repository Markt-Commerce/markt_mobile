import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useUser } from "../../hooks/userContextProvider";
import { sendVerificationEmail } from "../../services/sections/auth";
import { register,useRegData } from "../../models/signupSteps";

const EmailVerification = () => {
  const router = useRouter();
  const { regData, setRegData } = useRegData();

  const [verificationCodeSent, setVerificationCodeSent] = useState(false);

  const handleSendVerificationCode = async () => {
    try {
      if (!regData?.email) {
        console.error("User email is not available.");
        return;
      }
      await sendVerificationEmail(regData.email);
      setVerificationCodeSent(true);
    } catch (error) {
      console.error("Failed to send verification code:", error);
    }
  };

  return (
    <View className="flex-1 bg-white px-4">
      {/* Header */}
      <View className="flex flex-row items-center bg-white p-4 pb-2 justify-between">
        <ArrowLeft color="#181111" size={24} onPress={() => router.back()} />
        <Text className="text-[#181111] text-lg font-bold text-center flex-1 pr-12">
          Email Verification
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 justify-center items-center">
        {!verificationCodeSent ? (
          <>
            <Text className="text-[#171212] text-[28px] font-bold leading-tight text-center pb-3 pt-5">
              Verify Your Email
            </Text>
            <Text className="text-[#171212] text-base text-center pb-6">
              Send a verification code to your email address to verify your account.
            </Text>
            <TouchableOpacity
              className="bg-[#e9242a] rounded-full px-5 py-3"
              onPress={handleSendVerificationCode}
            >
              <Text className="text-white text-base font-bold">
                Send Verification Code
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="text-[#171212] text-[28px] font-bold leading-tight text-center pb-3 pt-5">
              Verification Code Sent
            </Text>
            <Text className="text-[#171212] text-base text-center pb-6">
              A verification code has been sent to your email address. Please
              check your inbox.
            </Text>
            <TouchableOpacity
              className="bg-[#e9242a] rounded-full px-5 py-3"
              onPress={handleSendVerificationCode}
            >
              <Text className="text-white text-base font-bold">
                Resend Verification Code
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

export default EmailVerification;
