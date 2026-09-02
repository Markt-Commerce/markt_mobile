/**
 * ContentActionsSheet — the "…" menu on a feed item.
 *
 * One sheet with internal steps rather than a stack of sheets: reporting is
 * actions → pick a reason → (optional) add detail → done, and each step asks
 * for exactly one thing. A header with a back affordance and a short caption
 * keeps you oriented, so it never feels like a form dumped on you.
 *
 * Report and block are App Store 1.2 requirements for user-generated content;
 * save is the everyday action and sits at the top where the thumb is.
 */

import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Share,
} from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  Check,
  Flag,
  Send,
  UserMinus,
} from "lucide-react-native";
import { useTheme } from "./themeProvider";
import { useToast } from "./ToastProvider";
import {
  reasonsFor,
  reportContent,
  blockUser,
  type ReportReason,
  type ReportableType,
} from "../services/sections/moderation";
import { saveItem, unsaveItem, type SavedType } from "../services/sections/saved";
import { friendlyErrorMessage } from "../utils/errorMessages";

type Step = "actions" | "reasons" | "details" | "done";

export interface ContentActionsTarget {
  type: SavedType;
  id: string;
  /** Shown in copy so the user knows what they're acting on. */
  title?: string;
  /** Author/seller user id — omit to hide Block. */
  authorId?: string;
  authorName?: string;
  /** Hide Block on your own content. */
  isOwn?: boolean;
  /** Deep link for the share sheet. */
  shareUrl?: string;
}

interface Props {
  target: ContentActionsTarget | null;
  saved: boolean;
  onClose: () => void;
  onSavedChange: (saved: boolean) => void;
  /** Lets the feed drop the item once its author is blocked. */
  onBlocked?: (userId: string) => void;
}

export default function ContentActionsSheet({
  target,
  saved,
  onClose,
  onSavedChange,
  onBlocked,
}: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { show } = useToast();

  const [step, setStep] = useState<Step>("actions");
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [blockedAuthor, setBlockedAuthor] = useState(false);

  // Reset every time a new item opens the sheet, or step state leaks between
  // two different posts.
  useEffect(() => {
    if (target) {
      setStep("actions");
      setReason(null);
      setDetails("");
      setBusy(false);
      setBlockedAuthor(false);
    }
  }, [target?.id]);

  const snapPoints = useMemo(
    () => (step === "actions" ? ["42%"] : step === "done" ? ["40%"] : ["68%"]),
    [step]
  );

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  const ink = isDark ? "text-[#f0f1f2]" : "text-black";
  const muted = isDark ? "text-[#c6c5cf]" : "text-tertiary";
  const rule = isDark ? "border-[#46464e]" : "border-border";
  const iconColor = isDark ? "#f0f1f2" : "#000000";

  const reasons = useMemo(
    () => reasonsFor((target?.type ?? "post") as ReportableType),
    [target?.type]
  );

  const close = () => {
    sheetRef.current?.close();
    onClose();
  };

  const handleToggleSave = async () => {
    if (!target || busy) return;
    const next = !saved;
    onSavedChange(next); // optimistic — the toggle should feel instant
    setBusy(true);
    try {
      if (next) await saveItem(target.type, target.id);
      else await unsaveItem(target.type, target.id);
      close();
      show({
        variant: "success",
        title: next ? "Saved" : "Removed",
        message: next ? "Find it later under Saved." : "No longer in your saved items.",
      });
    } catch (e) {
      onSavedChange(!next);
      show({
        variant: "error",
        title: next ? "Couldn't save that" : "Couldn't remove that",
        message: friendlyErrorMessage(e, "Check your connection and try again."),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    if (!target) return;
    close();
    try {
      await Share.share({
        message: target.title ? `Check out ${target.title} on Markt` : "Check this out on Markt",
        url: target.shareUrl ?? `markt://${target.type}/${target.id}`,
      });
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const submitReport = async () => {
    if (!target || !reason || busy) return;
    setBusy(true);
    try {
      const res = await reportContent(
        target.type as ReportableType,
        target.id,
        reason,
        details
      );
      setStep("done");
      if (res.already_reported) {
        show({
          variant: "info",
          title: "Already reported",
          message: "You've reported this before — our team is on it.",
        });
      }
    } catch (e) {
      show({
        variant: "error",
        title: "Couldn't send that report",
        message: friendlyErrorMessage(e, "Try again in a moment."),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleBlock = async () => {
    if (!target?.authorId || busy) return;
    setBusy(true);
    try {
      await blockUser(target.authorId);
      setBlockedAuthor(true);
      onBlocked?.(target.authorId);
      show({
        variant: "success",
        title: `${target.authorName ?? "Blocked"}`,
        message: "You won't see their posts or products again.",
      });
      close();
    } catch (e) {
      show({
        variant: "error",
        title: "Couldn't block them",
        message: friendlyErrorMessage(e, "Try again in a moment."),
      });
    } finally {
      setBusy(false);
    }
  };

  const Row = ({
    icon,
    label,
    caption,
    onPress,
    danger,
    last,
    a11y,
  }: {
    icon: React.ReactNode;
    label: string;
    caption?: string;
    onPress: () => void;
    danger?: boolean;
    last?: boolean;
    a11y?: string;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={busy}
      // min-h-[56px] keeps the target well past the 44pt floor once the row
      // has a caption and the user has large text turned on.
      className={`flex-row items-center gap-4 px-5 min-h-[56px] py-3 ${last ? "" : `border-b ${rule}`}`}
      accessibilityRole="button"
      accessibilityLabel={a11y ?? label}
      accessibilityState={{ disabled: busy }}
    >
      {icon}
      <View className="flex-1">
        <Text className={`text-[15px] font-semibold ${danger ? "text-primary" : ink}`}>
          {label}
        </Text>
        {caption ? <Text className={`text-[13px] mt-0.5 ${muted}`}>{caption}</Text> : null}
      </View>
    </Pressable>
  );

  const Header = ({ title, caption, onBack }: { title: string; caption?: string; onBack?: () => void }) => (
    <View className={`px-5 pb-3 pt-1 border-b ${rule}`}>
      <View className="flex-row items-center gap-2">
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            className="-ml-1 w-9 h-9 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ChevronLeft size={22} color={iconColor} />
          </Pressable>
        ) : null}
        <Text className={`text-[17px] font-bold flex-1 ${ink}`}>{title}</Text>
      </View>
      {caption ? <Text className={`text-[13px] mt-1 ${muted}`}>{caption}</Text> : null}
    </View>
  );

  if (!target) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: isDark ? "#1a1c1d" : "#ffffff" }}
      handleIndicatorStyle={{ backgroundColor: isDark ? "#46464e" : "#E4E4E7" }}
    >
      <BottomSheetView className="flex-1">
        {step === "actions" && (
          <>
            <Header title={target.title ? target.title : "Options"} />
            <Row
              icon={
                saved ? (
                  <BookmarkCheck size={20} color="#E94C2A" />
                ) : (
                  <Bookmark size={20} color={iconColor} />
                )
              }
              label={saved ? "Saved" : "Save"}
              caption={saved ? "Tap to remove from your saved items" : "Keep this for later"}
              onPress={handleToggleSave}
              a11y={saved ? "Remove from saved" : "Save for later"}
            />
            <Row
              icon={<Send size={20} color={iconColor} />}
              label="Share"
              caption="Send to a friend"
              onPress={handleShare}
            />
            <Row
              icon={<Flag size={20} color="#E94C2A" />}
              label="Report"
              caption="Tell us what's wrong with this"
              onPress={() => setStep("reasons")}
              danger
              last={!target.authorId || target.isOwn}
            />
            {target.authorId && !target.isOwn ? (
              <Row
                icon={<UserMinus size={20} color="#E94C2A" />}
                label={`Block ${target.authorName ?? "this person"}`}
                caption="You'll stop seeing anything they post"
                onPress={handleBlock}
                danger
                last
              />
            ) : null}
          </>
        )}

        {step === "reasons" && (
          <>
            <Header
              title="What's wrong?"
              caption="Pick the closest one. Reports are anonymous."
              onBack={() => setStep("actions")}
            />
            <ScrollView keyboardShouldPersistTaps="handled">
              {reasons.map((r, i) => (
                <Row
                  key={r.value}
                  icon={
                    <View
                      className={`w-5 h-5 rounded-full border-2 items-center justify-center ${reason === r.value ? "border-primary bg-primary" : isDark ? "border-[#46464e]" : "border-border"}`}
                    >
                      {reason === r.value ? <Check size={12} color="#fff" /> : null}
                    </View>
                  }
                  label={r.label}
                  caption={r.hint}
                  onPress={() => {
                    setReason(r.value);
                    setStep("details");
                  }}
                  last={i === reasons.length - 1}
                  a11y={`${r.label}. ${r.hint}`}
                />
              ))}
            </ScrollView>
          </>
        )}

        {step === "details" && (
          <>
            <Header
              title="Anything to add?"
              caption={
                reason === "other"
                  ? "A sentence or two helps us act on this."
                  : "Optional — skip if there's nothing to add."
              }
              onBack={() => setStep("reasons")}
            />
            <View className="px-5 pt-4">
              <TextInput
                value={details}
                onChangeText={setDetails}
                multiline
                maxLength={2000}
                placeholder="What happened?"
                placeholderTextColor={isDark ? "#6b6b73" : "#A1A1AA"}
                className={`min-h-[110px] rounded border px-4 py-3 text-[15px] ${isDark ? "bg-[#1a1c1d] border-[#46464e] text-[#f0f1f2]" : "bg-white border-border text-black"}`}
                textAlignVertical="top"
                accessibilityLabel="Add details about your report, optional"
              />
              <Pressable
                onPress={submitReport}
                disabled={busy}
                className={`mt-5 h-14 rounded items-center justify-center ${busy ? "opacity-70" : ""} bg-primary`}
                accessibilityRole="button"
                accessibilityLabel="Send report"
                accessibilityState={{ disabled: busy, busy }}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-bold text-xs tracking-[2px] uppercase">
                    Send report
                  </Text>
                )}
              </Pressable>
            </View>
          </>
        )}

        {step === "done" && (
          <View className="px-6 pt-6 items-center">
            <View className="w-14 h-14 rounded-full bg-primary items-center justify-center">
              <Check size={26} color="#FFFFFF" />
            </View>
            <Text className={`text-[19px] font-bold mt-4 text-center ${ink}`}>
              Thanks for telling us
            </Text>
            <Text className={`text-[14px] mt-2 text-center leading-5 ${muted}`}>
              Our team will take a look. You won't hear back on every report, but
              it does get read.
            </Text>

            {target.authorId && !target.isOwn && !blockedAuthor ? (
              <Pressable
                onPress={handleBlock}
                disabled={busy}
                className={`mt-6 h-12 px-6 rounded border w-full items-center justify-center ${rule}`}
                accessibilityRole="button"
                accessibilityLabel={`Also block ${target.authorName ?? "this person"}`}
              >
                <Text className={`font-bold text-xs tracking-[2px] uppercase ${ink}`}>
                  Also block {target.authorName ?? "them"}
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={close}
              className="mt-3 h-12 px-6 w-full items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text className={`font-bold text-xs tracking-[2px] uppercase ${muted}`}>
                Done
              </Text>
            </Pressable>
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}
