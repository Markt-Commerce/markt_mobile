/**
 * Delete account — Apple App Store guideline 5.1.1(v).
 *
 * An account created in the app must be deletable from inside the app;
 * deactivation does not satisfy the requirement. The flow is deliberately
 * three gates deep because it cannot be undone: the server reports any
 * blockers up front, then the user types DELETE, then confirms their password.
 */

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { AlertTriangle, Trash2 } from "lucide-react-native";
import ScreenHeader from "../../components/ScreenHeader";
import { useTheme } from "../../components/themeProvider";
import { useToast } from "../../components/ToastProvider";
import { useUser } from "../../hooks/userContextProvider";
import { navigateToGuestHome } from "../../utils/authNavigation";
import {
  checkAccountDeletion,
  deleteAccount,
  type AccountDeletionBlocker,
} from "../../services/sections/account";
import { friendlyErrorMessage } from "../../utils/errorMessages";

const CONFIRM_WORD = "DELETE";

/** What is destroyed vs. kept, stated plainly before anything happens. */
const REMOVED = [
  "Your name, email address, phone number and profile photo",
  "Your delivery address and saved payout bank details",
  "Your cart, follows and notification settings",
];

const RETAINED = [
  "Orders and payment records, which we must keep for financial reporting",
  "Posts, comments and reviews, shown as from a deleted user so other people's conversations stay readable",
];

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { show } = useToast();
  const { setUser } = useUser();

  const [checking, setChecking] = useState(true);
  const [blockers, setBlockers] = useState<AccountDeletionBlocker[]>([]);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const loadBlockers = useCallback(async () => {
    setChecking(true);
    try {
      const res = await checkAccountDeletion();
      setBlockers(res.blockers);
    } catch (e) {
      show({
        variant: "error",
        title: "Could not check your account",
        message: friendlyErrorMessage(e, "Please try again."),
      });
    } finally {
      setChecking(false);
    }
  }, [show]);

  // Re-checked on focus: the user may have just gone off to withdraw their
  // balance or cancel an order to clear a blocker.
  useFocusEffect(
    useCallback(() => {
      loadBlockers();
    }, [loadBlockers])
  );

  const blocked = blockers.length > 0;
  const canSubmit =
    !blocked && !deleting && confirmText.trim() === CONFIRM_WORD && password.length > 0;

  const handleDelete = async () => {
    if (!canSubmit) return;
    setDeleting(true);
    try {
      await deleteAccount(password);
      setUser(null);
      show({
        variant: "info",
        title: "Account deleted",
        message: "Your account and personal data have been removed.",
      });
      navigateToGuestHome();
    } catch (e) {
      // A blocker can appear between the check and the delete (an order that
      // just moved, a settlement that just landed), so re-read them.
      loadBlockers();
      show({
        variant: "error",
        title: "Could not delete account",
        message: friendlyErrorMessage(e, "Please check your password and try again."),
      });
      setDeleting(false);
    }
  };

  const label = isDark ? "text-text-primary" : "text-black";
  const muted = isDark ? "text-text-secondary" : "text-tertiary";
  const card = isDark ? "bg-surface-raised border-border-strong" : "bg-white border-border";

  return (
    <SafeAreaView
      className={`flex-1 bg-surface-raised`}
      edges={["top", "left", "right", "bottom"]}
    >
      <ScreenHeader title="Delete account" onBack={() => router.back()} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 pt-6">
          <View className="flex-row items-start gap-3 mb-6">
            <AlertTriangle size={22} color="#E94C2A" strokeWidth={2} />
            <Text className={`flex-1 text-[15px] leading-6 ${label}`}>
              Deleting your account is permanent. It cannot be undone, and you
              will not be able to sign in again.
            </Text>
          </View>

          {checking ? (
            <View className="py-10 items-center">
              <ActivityIndicator size="small" color="#E94C2A" />
            </View>
          ) : blocked ? (
            <View className="rounded border border-[#E94C2A] p-4 mb-6">
              <Text className="font-bold text-[11px] tracking-[2px] uppercase text-primary mb-3">
                Resolve these first
              </Text>
              {blockers.map((b) => (
                <Text key={b.code} className={`text-[14px] leading-6 mb-2 ${label}`}>
                  • {b.message}
                </Text>
              ))}
              <TouchableOpacity
                onPress={loadBlockers}
                activeOpacity={0.8}
                className="mt-2 self-start"
                accessibilityRole="button"
                accessibilityLabel="Check again"
              >
                <Text className="font-bold text-[11px] tracking-[2px] uppercase text-primary">
                  Check again
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View className={`rounded border p-4 mb-4 ${card}`}>
            <Text className={`font-bold text-[11px] tracking-[2px] uppercase mb-3 ${muted}`}>
              What gets removed
            </Text>
            {REMOVED.map((line) => (
              <Text key={line} className={`text-[14px] leading-6 mb-1.5 ${label}`}>
                • {line}
              </Text>
            ))}
          </View>

          <View className={`rounded border p-4 mb-8 ${card}`}>
            <Text className={`font-bold text-[11px] tracking-[2px] uppercase mb-3 ${muted}`}>
              What we keep
            </Text>
            {RETAINED.map((line) => (
              <Text key={line} className={`text-[14px] leading-6 mb-1.5 ${muted}`}>
                • {line}
              </Text>
            ))}
          </View>

          <Text className={`font-bold text-[11px] tracking-[2px] uppercase mb-2 ${muted}`}>
            Type {CONFIRM_WORD} to confirm
          </Text>
          <TextInput
            value={confirmText}
            onChangeText={setConfirmText}
            editable={!blocked && !deleting}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder={CONFIRM_WORD}
            placeholderTextColor={isDark ? "#6b6b73" : "#A1A1AA"}
            className={`h-14 rounded border px-4 text-[15px] mb-5 ${card} ${label}`}
            accessibilityLabel={`Type ${CONFIRM_WORD} to confirm account deletion`}
          />

          <Text className={`font-bold text-[11px] tracking-[2px] uppercase mb-2 ${muted}`}>
            Confirm your password
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            editable={!blocked && !deleting}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            placeholder="Your password"
            placeholderTextColor={isDark ? "#6b6b73" : "#A1A1AA"}
            className={`h-14 rounded border px-4 text-[15px] mb-8 ${card} ${label}`}
            accessibilityLabel="Confirm your password to delete your account"
          />

          <TouchableOpacity
            onPress={handleDelete}
            disabled={!canSubmit}
            activeOpacity={0.85}
            className={`h-14 rounded items-center justify-center flex-row gap-2 ${canSubmit ? "bg-primary" : isDark ? "bg-surface-sunken" : "bg-bg-muted"}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
            accessibilityLabel="Permanently delete my account"
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Trash2
                  size={18}
                  color={canSubmit ? "#FFFFFF" : isDark ? "#c6c5cf" : "#71717A"}
                  strokeWidth={1.8}
                />
                <Text
                  className={`font-bold text-xs tracking-[2px] uppercase ${canSubmit ? "text-white" : muted}`}
                >
                  Delete my account
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
