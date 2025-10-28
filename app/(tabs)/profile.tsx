import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Switch } from "react-native";
import { ArrowLeft, Bell, Sun, Globe, User, Lock, CreditCard, Truck, Link as LinkIcon, HelpCircle as Question, FileText, ShieldCheck, Info, ArrowRight } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser } from "../../hooks/userContextProvider";
import {getUserProfile, updateBuyerProfile, updateSellerProfile, updateUserProfile} from "../../services/sections/profile"
import { UserProfile } from "../../models/profile";
import { useTheme } from "../../components/themeProvider";    // <- simple context (no NativeWind)
import { TView, TText } from "../../components/themed";       // <- Themed components (pick classes via context)
import { useToast } from "../../components/ToastProvider";    // <- optional toast
import { createBuyer, logoutUser, switchUserRole } from "../../services/sections/auth";

export default function SettingsProfileScreen() {
  const nav = useRouter();
  const { user, role, setRole } = useUser();
  const { resolvedTheme, setTheme } = useTheme();
  const { show } = useToast();

  const [notificationsOn, setNotificationsOn] = useState(true);
  const [appearance, setAppearance] = useState<"light" | "dark">(resolvedTheme);
  const [language, setLanguage] = useState<"EN" | "FR">("EN");
  const [profileData, setProfileData] = useState<UserProfile>();

  //get and set api functions.
  const getUserData = async () => {
    try {
      const result = await getUserProfile();
      setProfileData(result);
    } catch (error) {
      show({
        variant: "error",
        title: "Error getting profile data",
        message: "There was an issue retrieving your profile information.",
      })
    }
  }

  const SwitchRole = async () => {
    try {
     const switchResult = await switchUserRole();
     console.log(switchResult)
      setRole(switchResult.user.current_role)
      
    } catch (error) {
      show({
        message: `An error occured switching to the ${role == "buyer"? "seller" : "buyer"} account. Please try again later`,
        title: "Could not switch account",
        variant: "error"
      })
    }
  }

  useEffect(()=>{
    getUserData()
  },[user])

  useEffect(() => setAppearance(resolvedTheme), [resolvedTheme]);



  // ---------- UI Helpers ----------
  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View className="w-full max-w-[640px] self-center px-4">
      <TText
        light="text-[#8e7a74]"
        dark="text-neutral-400"
        className="px-1 pt-6 pb-2 text-xs font-semibold uppercase tracking-wider"
      >
        {title}
      </TText>

      <TView
        light="bg-white border-[#efe9e7]"
        dark="bg-neutral-900 border-neutral-800"
        className="rounded-2xl border overflow-hidden"
      >
        {children}
      </TView>
    </View>
  );

  const DetermineSwitchType: React.FC<{ hasBuyerAccount:boolean, hasSellerAccount:boolean}> = ({ 
    hasBuyerAccount,
    hasSellerAccount,
   }) => {
    const oppAccount: "Buyer" | "Seller" = role === "buyer" ? "Seller" : "Buyer";
    return role == "buyer" && hasSellerAccount ? (
          <TouchableOpacity onPress={()=> {SwitchRole()}} className="flex-1 rounded-lg h-10  justify-center items-center bg-[#e26136]">
            <Text className="text-white">Switch To Seller Account</Text>
          </TouchableOpacity>
        ) :
            role == "seller" && hasBuyerAccount ? (
            <TouchableOpacity onPress={()=> {SwitchRole()}} className="flex-1 rounded-lg h-10 justify-center items-center bg-[#e26136]">
              <Text className="text-white">Switch To Buyer Account</Text>
              </TouchableOpacity>
          ) :
            (
              /* Will go to a page or a bottom sheet to input the buyer details */
            <TouchableOpacity onPress={()=>""} className="flex-1 rounded-lg h-10 justify-center items-center bg-[#e26136]">
              <Text className="text-white">Create A {oppAccount} Account</Text>
              </TouchableOpacity>
          )
   };

  const Row: React.FC<{
    children: React.ReactNode;
    onPress?: () => void;
    showChevron?: boolean;
    last?: boolean;
    trailing?: React.ReactNode;
  }> = ({ children, onPress, showChevron, last, trailing }) => {
    const Comp: any = onPress ? TouchableOpacity : View;
    return (
      <Comp
        onPress={onPress}
        activeOpacity={0.7}
        className={`flex-row items-center justify-between px-4 py-4 ${
          last ? "" : "border-b"
        }`}
      >
        <TView
          light=""
          dark=""
          className={`flex-row items-center gap-3 ${last ? "" : ""}`}
        >
          {children}
        </TView>

        <View className="flex-row items-center gap-2">
          {trailing}
          {showChevron ? (
            <ArrowRight size={18} color={resolvedTheme === "dark" ? "#9ca3af" : "#7a6963"} />
          ) : null}
        </View>
      </Comp>
    );
  };

  const Divider: React.FC = () => (
    <TView light="bg-[#f3efed]" dark="bg-neutral-800" className="h-[1px]" />
  );

  const Pill: React.FC<{ active?: boolean; label: string; onPress?: () => void; className?: string }> = ({
    active,
    label,
    onPress,
    className,
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={`px-3 py-1.5 rounded-full ${
        active ? "bg-[#e26136]" : "bg-[#f5f2f1] dark:bg-neutral-800"
      } ${className ?? ""}`}
    >
      <TText light={active ? "text-white" : "text-[#171311]"} dark={active ? "text-white" : "text-neutral-100"}>
        {label}
      </TText>
    </TouchableOpacity>
  );

  // ---------- Handlers ----------
  const chooseAppearance = (v: "light" | "dark") => {
    setAppearance(v);
    setTheme(v);
    show({
      variant: "success",
      title: "Theme updated",
      message: `Switched to ${v} mode.`,
    });
  };

  return (
    <SafeAreaView className="flex-1">
      <TView light="bg-white" dark="bg-[#0b0b0c]" className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center p-4 pb-2 justify-between">
            <TouchableOpacity onPress={() => nav.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <ArrowLeft size={24} color={resolvedTheme === "dark" ? "#e5e7eb" : "#171311"} />
            </TouchableOpacity>
            <TText
              light="text-[#171311]"
              dark="text-neutral-100"
              className="flex-1 text-center pr-12 text-lg font-bold"
            >
              Profile & Settings
            </TText>
          </View>

          {/* Profile Card */}
          <View className="w-full max-w-[640px] self-center px-4">
            <TView
              light="bg-white border-[#efe9e7]"
              dark="bg-neutral-900 border-neutral-800"
              className="items-center rounded-2xl border px-5 py-6"
            >
              <Image source={{  uri: profileData?.profile_picture_url ?? "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y" }} className="w-28 h-28 rounded-full" />
              <TText
                light="text-[#171311]"
                dark="text-neutral-100"
                className="text-[20px] font-bold mt-3"
              >
                {role === "buyer" ? profileData?.buyer_account.buyername : role === "seller" ? profileData?.seller_account.shop_name : "Guest"}
              </TText>
              <TText
                light="text-[#876d64]"
                dark="text-neutral-400"
                className="text-sm"
              >
                @{profileData?.username ?? "unavailable"} | {role}
              </TText>
              <TText
                light="text-[#876d64]"
                dark="text-neutral-400"
                className="text-sm"
              >
                Joined {profileData?.created_at ? String(new Date(profileData.created_at).getFullYear()) : "now maybe"}
              </TText>
            </TView>
          </View>

          <View>
            <DetermineSwitchType hasBuyerAccount={profileData?.is_buyer ?? false} hasSellerAccount={profileData?.is_seller ?? false}/>
          </View>


          {/* App Preferences */}
          <Section title="App Preferences">
            {/* Notifications */}
            <Row
              trailing={
                <Switch
                  value={notificationsOn}
                  onValueChange={setNotificationsOn}
                  thumbColor={resolvedTheme === "dark" ? "#f8fafc" : "#ffffff"}
                  trackColor={{ false: resolvedTheme === "dark" ? "#334155" : "#d8d1ce", true: "#e26136" }}
                />
              }
            >
              <TView light="bg-[#f4f1f0]" dark="bg-neutral-800" className="p-2 rounded-lg">
                <Bell size={20} color={resolvedTheme === "dark" ? "#e5e7eb" : "#171311"} />
              </TView>
              <View>
                <TText light="text-[#171311]" dark="text-neutral-100" className="text-base font-medium">
                  Notifications
                </TText>
                <TText light="text-[#876d64]" dark="text-neutral-400" className="text-sm">
                  Enable or disable notifications
                </TText>
              </View>
            </Row>
            <Divider />

            {/* Appearance */}
            <Row
              trailing={
                <TView light="bg-[#f5f2f1]" dark="bg-neutral-800" className="flex-row items-center rounded-full p-1">
                  <Pill label="Light" active={appearance === "light"} onPress={() => chooseAppearance("light")} />
                  <Pill label="Dark"  active={appearance === "dark"}  onPress={() => chooseAppearance("dark")}  className="ml-1" />
                </TView>
              }
            >
              <TView light="bg-[#f4f1f0]" dark="bg-neutral-800" className="p-2 rounded-lg">
                <Sun size={20} color={resolvedTheme === "dark" ? "#e5e7eb" : "#171311"} />
              </TView>
              <View>
                <TText light="text-[#171311]" dark="text-neutral-100" className="text-base font-medium">
                  Appearance
                </TText>
                <TText light="text-[#876d64]" dark="text-neutral-400" className="text-sm">
                  Customize app theme
                </TText>
              </View>
            </Row>
            <Divider />

            {/* Language */}
            <Row
              last
              trailing={
                <TView light="bg-[#f5f2f1]" dark="bg-neutral-800" className="flex-row items-center rounded-full p-1">
                  <Pill label="EN" active={language === "EN"} onPress={() => setLanguage("EN")} />
                  <Pill label="FR" active={language === "FR"} onPress={() => setLanguage("FR")} className="ml-1" />
                </TView>
              }
            >
              <TView light="bg-[#f4f1f0]" dark="bg-neutral-800" className="p-2 rounded-lg">
                <Globe size={20} color={resolvedTheme === "dark" ? "#e5e7eb" : "#171311"} />
              </TView>
              <View>
                <TText light="text-[#171311]" dark="text-neutral-100" className="text-base font-medium">
                  Language
                </TText>
                <TText light="text-[#876d64]" dark="text-neutral-400" className="text-sm">
                  Manage language preferences
                </TText>
              </View>
            </Row>
          </Section>

          {/* Account Management */}
          <Section title="Account Management">
            {[
              { label: "Account Information", icon: User, route: "/account/info" },
              { label: "Change Password", icon: Lock, route: "/account/change-password" },
              { label: "Payment Methods", icon: CreditCard, route: "/account/payments" },
              { label: "Shipping Addresses", icon: Truck, route: "/account/addresses" },
              { label: "Linked Accounts", icon: LinkIcon, route: "/account/linked" },
            ].map((item, i, arr) => {
              const Icon = item.icon;
              return (
                <Row
                  key={i}
                  onPress={() => nav.push(item.route as any)}
                  showChevron
                  last={i === arr.length - 1}
                >
                  <TView light="bg-[#f4f1f0]" dark="bg-neutral-800" className="p-2 rounded-lg">
                    <Icon size={20} color={resolvedTheme === "dark" ? "#e5e7eb" : "#171311"} />
                  </TView>
                  <TText light="text-[#171311]" dark="text-neutral-100" className="text-base font-medium">
                    {item.label}
                  </TText>
                </Row>
              );
            })}
          </Section>

          {/* Support & Information */}
          <Section title="Support & Information">
            {[
              { label: "Help Center", icon: Question, route: "/support/help" },
              { label: "Terms of Service", icon: FileText, route: "/support/terms" },
              { label: "Privacy Policy", icon: ShieldCheck, route: "/support/privacy" },
              { label: "About", icon: Info, route: "/support/about" },
            ].map((item, i, arr) => {
              const Icon = item.icon;
              return (
                <Row
                  key={i}
                  onPress={() => nav.push(item.route as any)}
                  showChevron
                  last={i === arr.length - 1}
                >
                  <TView light="bg-[#f4f1f0]" dark="bg-neutral-800" className="p-2 rounded-lg">
                    <Icon size={20} color={resolvedTheme === "dark" ? "#e5e7eb" : "#171311"} />
                  </TView>
                  <TText light="text-[#171311]" dark="text-neutral-100" className="text-base font-medium">
                    {item.label}
                  </TText>
                </Row>
              );
            })}
          </Section>

          {/* Logout */}
          <View className="w-full max-w-[640px] self-center px-4 pt-4 pb-6">
            <TouchableOpacity
              className="h-11 rounded-full justify-center items-center active:opacity-85"
              onPress={() => {
                try {
                 logoutUser(); 
                 show({ variant: "info", title: "Logged out", message: "You’ve been signed out." });
                 nav.push("/login")
                } catch (error) {
                  show({
                    variant: "error",
                    title: "Error Logging out",
                    message: "We could not log you out of your account. Please try again"
                  })
                }
              }}
              style={{ backgroundColor: resolvedTheme === "dark" ? "#111827" : "#f4f1f0" }}
            >
              <TText light="text-[#171311]" dark="text-neutral-100" className="font-semibold">
                Log Out
              </TText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TView>
    </SafeAreaView>
  );
}
