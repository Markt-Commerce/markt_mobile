import React, { useState } from "react";
import { ActivityIndicator, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ShoppingBag, Store, Check } from "lucide-react-native";
import StepDots from "../../components/auth/StepDots";
import { useTokens } from "../../theme/useTokens";
import { useUser } from "../../hooks/userContextProvider";
import { ensureBuyerRole } from "../../services/sections/roles";
import { logger } from "../../utils/logger";

/**
 * Buyer or seller — asked here, not on the signup form.
 *
 * The old flow put this as a segmented control above the email field, before
 * the user had seen anything, and silently forked the next three screens off
 * it. Asked here it is a real choice with a sentence of explanation, and
 * changing your mind later is a setting rather than a re-registration.
 *
 * Both options are equally weighted: nothing here nudges toward selling.
 */
const OPTIONS = [
  {
    id: "buyer" as const,
    Icon: ShoppingBag,
    title: "I'm here to buy",
    blurb: "Browse what's nearby, message sellers, and check out securely.",
  },
  {
    id: "seller" as const,
    Icon: Store,
    title: "I'm here to sell",
    blurb: "List what you have, reach local buyers, and get paid through Markt.",
  },
];

export default function YourRole() {
  const router = useRouter();
  const t = useTokens();
  const { setRole, refreshProfile, profile, setProfile } = useUser();
  const { name } = useLocalSearchParams<{ name?: string }>();
  const [choice, setChoice] = useState<"buyer" | "seller" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = async () => {
    if (!choice || saving) return;
    setError(null);
    setSaving(true);
    try {
      await finish(choice);
    } finally {
      // Always. The button used to be able to stay on "Setting up…"
      // forever, because nothing reset it and the navigation below can
      // legitimately do nothing -- see the guard note there.
      setSaving(false);
    }
  };

  const finish = async (choice: "buyer" | "seller") => {
    setRole(choice);

    // The most recent view of the account we have. Updated in place as the
    // steps below learn more, so the navigation at the end decides on the
    // freshest thing available rather than on whatever context happened to
    // be holding when this started.
    let latest = profile;

    // Give the account the role it just chose.
    //
    // This used to call updateBuyerProfile, which only works if a buyer row
    // already exists. Password signup creates one; signing in with Google
    // or Apple does not — the provider proves the address and nothing else.
    // So for every OAuth signup this failed, the failure was logged and
    // swallowed, and the person landed in the app belonging to neither side
    // of the marketplace. Nothing worked, because there was nothing to work
    // as, and signing out made it permanent: login refused an account with
    // no role at all.
    //
    // Not best-effort any more, for the same reason. A name that fails to
    // save is a nuisance; a role that fails to save is an unusable account.
    if (choice === "buyer") {
      try {
        // The create call answers with the account as the server now sees
        // it, so there is no refresh to race afterwards — which matters,
        // because the startup gate in app/_layout.tsx redirects on
        // next_step and a stale "choose_role" would bounce the person
        // straight back to this screen.
        const fresh = await ensureBuyerRole(profile, { buyername: name?.trim() });
        if (fresh) {
          setProfile(fresh);
          latest = fresh;
        }
      } catch (e) {
        logger.warn("onboarding: could not set up the buyer account", e);
        setError(
          "We could not finish setting up your account. Check your connection and try again."
        );
        return;
      }
    }

    // `replace`, not `push`: finishing onboarding must not leave the flow in
    // history. The old emailVerification screen pushed, so an iOS swipe-back
    // landed the user right back inside signup.
    //
    // The shop itself is created on the next screen, which is where its
    // name and location are asked for.
    if (choice === "seller") {
      router.replace({
        pathname: "/(onboarding)/shopBasics",
        params: name ? { name } : {},
      });
      return;
    }

    // Only if the step above did not already hand one back. Bounded, so a
    // slow server cannot leave the button disabled with no explanation.
    if (latest === profile) {
      try {
        latest =
          ((await Promise.race([
            refreshProfile(),
            new Promise((resolve) => setTimeout(resolve, 4000)),
          ])) as typeof latest) ?? profile;
      } catch {
        // Guard falls back to "unknown", which permits.
      }
    }

    // The tabs live inside a Stack.Protected guarded on the address having
    // been verified (app/_layout.tsx). When that guard is closed the route
    // is not in the navigator at all, so replacing onto it does not fail --
    // it does *nothing*, silently, and the screen stays exactly where it
    // is. Combined with a button that never reset, that was the whole of
    // "Setting up…" forever.
    //
    // So check, and send them somewhere that exists.
    if (latest?.onboarding?.email_verified === false) {
      router.replace("/(onboarding)/emailVerification");
      return;
    }
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1 px-6 pt-6">
        <StepDots total={2} current={2} className="mb-10" />

        <Text className="text-[28px] font-bold leading-9 text-text-primary">
          How will you use Markt?
        </Text>
        <Text className="text-base mt-2 text-text-secondary">
          You can do both — this just sets up your home screen. Change it any
          time in settings.
        </Text>

        <View className="gap-3 mt-8">
          {OPTIONS.map(({ id, Icon, title, blurb }) => {
            const selected = choice === id;
            return (
              <Pressable
                key={id}
                onPress={() => setChoice(id)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${title}. ${blurb}`}
                className={`flex-row items-start gap-4 rounded-2xl border p-4 ${
                  selected
                    ? "border-primary bg-primary-muted"
                    : "border-border bg-surface-raised"
                }`}
              >
                <View
                  className="w-11 h-11 rounded-full items-center justify-center"
                  style={{ backgroundColor: selected ? t.primaryMuted : t.surfaceSunken }}
                >
                  <Icon
                    size={22}
                    color={selected ? t.primaryText : t.textSecondary}
                    strokeWidth={1.9}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[17px] font-bold text-text-primary">{title}</Text>
                  <Text className="text-[13px] mt-1 leading-5 text-text-secondary">
                    {blurb}
                  </Text>
                </View>
                {selected ? (
                  <View className="w-6 h-6 rounded-full items-center justify-center bg-primary-fill mt-0.5">
                    <Check size={14} color={t.textOnPrimary} strokeWidth={3} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="px-6 pb-6">
        {error ? (
          <Text className="text-[13px] mb-3 text-danger-text">{error}</Text>
        ) : null}
        <Pressable
          onPress={done}
          disabled={!choice || saving}
          accessibilityRole="button"
          accessibilityState={{ disabled: !choice || saving, busy: saving }}
          className={`h-[52px] rounded-xl flex-row items-center justify-center gap-2 ${
            choice ? "bg-primary-fill" : "bg-surface-sunken"
          } ${saving ? "opacity-80" : ""}`}
        >
          {saving ? <ActivityIndicator size="small" color={t.textOnPrimary} /> : null}
          <Text
            className={`text-[16px] font-bold ${
              choice ? "text-text-on-primary" : "text-text-muted"
            }`}
          >
            {saving
              ? "Setting up…"
              : choice === "seller"
                ? "Set up my shop"
                : "Start browsing"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
