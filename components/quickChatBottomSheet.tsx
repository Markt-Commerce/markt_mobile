import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import type { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { ArrowLeft } from "lucide-react-native";
import ChatScreen from "./chat";
import Avatar from "./Avatar";
import { createOrGetRoom } from "../services/sections/chat";
import { runMessageSellerFlow } from "../utils/messageSellerFlow";
import { getProductById } from "../services/sections/product";
import { ChatRoomLite } from "../models/chat";
import { useToast } from "./ToastProvider";
import { friendlyErrorMessage } from "../utils/errorMessages";
import { useUser } from "../hooks/userContextProvider";
import { isOwnProductListing } from "../utils/chatGuards";
import { useTokens } from "../theme/useTokens";
import { pickProfilePicture, type ChatOtherUser } from "../utils/chatAvatar";

export type QuickChatBottomSheetProps = {
  /** Seller's user id (UUID) — used when current user is buyer (CHATS_API §1.2) */
  sellerId?: string;
  /** Buyer's user id — used when current user is seller */
  buyerId?: string;
  /** Product id — optional room metadata; when set, auto-sends a product context message */
  product_id?: string;
  /** Other user info for chat header */
  otherUser?: ChatOtherUser;
  /** True when current user is buyer chatting with seller; false when seller chatting with buyer */
  asBuyer?: boolean;
  sheetRef: React.RefObject<BottomSheetMethods | null>;
};

/** User ids are UUIDs (e.g. USR_xxx); numeric strings are likely seller account ids */
function looksLikeUserUuid(id: string | undefined): boolean {
  if (!id || typeof id !== "string") return false;
  return id.includes("-") || id.startsWith("USR_") || id.length > 10;
}

export default function QuickChatBottomSheet({
  sellerId,
  buyerId,
  product_id,
  otherUser,
  asBuyer = true,
  sheetRef,
}: QuickChatBottomSheetProps) {
  const { show } = useToast();
  const { user } = useUser();
  const t = useTokens();
  const textColor = t.textPrimary;
  const currentUserId = user?.user_id?.toString() ?? "";
  const [sheetOpen, setSheetOpen] = useState(false);
  const insets = useSafeAreaInsets();

  /**
   * The modal's own open state, driven through the ref the call sites
   * already hold.
   *
   * They call `sheetRef.current?.expand()`, which was a @gorhom method. Rather
   * than change every caller, the ref is filled with the two methods they
   * actually use -- so this became a modal without a single call site
   * knowing.
   */
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handle = {
      expand: () => setVisible(true),
      snapToIndex: () => setVisible(true),
      close: () => setVisible(false),
      forceClose: () => setVisible(false),
      collapse: () => setVisible(false),
    } as unknown as BottomSheetMethods;
    (sheetRef as React.MutableRefObject<BottomSheetMethods | null>).current =
      handle;
    return () => {
      (sheetRef as React.MutableRefObject<BottomSheetMethods | null>).current =
        null;
    };
  }, [sheetRef]);

  // The room fetch and teardown keyed off the sheet's index callback; now it
  // keys off visibility, which is the same signal by another name.
  useEffect(() => {
    setSheetOpen(visible);
    if (!visible) {
      // Drop the room on close, exactly as the sheet's index callback did:
      // reopening on a different product must not flash the last one's thread.
      fetchGenRef.current += 1;
      setRoomData(null);
      setRoomLoading(false);
      setRoomError(null);
    }
  }, [visible]);
  const [roomData, setRoomData] = useState<ChatRoomLite | null>(null);
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [otherUserResolved, setOtherUserResolved] = useState(otherUser);
  const fetchGenRef = useRef(0);
  const [sheetFooter, setSheetFooter] = useState<React.ReactNode>(null);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    setOtherUserResolved(otherUser);
  }, [otherUser]);

  const fetchRoomData = useCallback(async () => {
    const gen = ++fetchGenRef.current;
    const stale = () => gen !== fetchGenRef.current;

    setRoomData(null);
    setRoomError(null);
    setRoomLoading(true);

    try {
      if (asBuyer) {
        let resolvedSellerId = sellerId;
        let resolvedOtherUser = otherUser;

        if (
          (!resolvedSellerId || !looksLikeUserUuid(resolvedSellerId)) &&
          product_id
        ) {
          try {
            const product = await getProductById(product_id);
            if (stale()) return;
            const su =
              (product as any).seller_user ?? (product as any).seller?.user;
            resolvedSellerId = su?.id ? String(su.id) : resolvedSellerId;
            if (su && !resolvedOtherUser) {
              resolvedOtherUser = {
                username: su.username,
                profile_picture: su.profile_picture ?? su.profile_picture_url,
              };
            }
            setOtherUserResolved(resolvedOtherUser);
          } catch {
            if (!stale()) {
              setRoomError("Could not load product. Please try again.");
              show({
                variant: "error",
                title: "Error",
                message: "Could not load product. Please try again.",
              });
            }
            return;
          }
        }

        if (!resolvedSellerId) {
          if (!stale()) {
            setRoomError("Could not find seller.");
            show({
              variant: "error",
              title: "Invalid data",
              message: "Could not find seller. Try opening the product first.",
            });
          }
          return;
        }

        if (isOwnProductListing(currentUserId, resolvedSellerId)) {
          if (!stale()) {
            setRoomError("You cannot message yourself.");
            show({
              variant: "info",
              title: "Cannot chat",
              message: "You cannot message yourself about your own product.",
            });
          }
          return;
        }

        const result =
          product_id
            ? (
                await runMessageSellerFlow({
                  sellerUserId: resolvedSellerId,
                  productId: product_id,
                  otherUser: resolvedOtherUser,
                })
              ).room
            : await createOrGetRoom({
                seller_id: resolvedSellerId,
                product_id,
              });
        if (stale()) return;
        setRoomData(result);
      } else {
        if (!buyerId) {
          if (!stale()) {
            setRoomError("Buyer ID is required.");
            show({
              variant: "error",
              title: "Invalid IDs",
              message: "Buyer ID must be provided.",
            });
          }
          return;
        }

        if (isOwnProductListing(currentUserId, buyerId)) {
          if (!stale()) {
            setRoomError("You cannot message yourself.");
            show({
              variant: "info",
              title: "Cannot chat",
              message: "You cannot start a chat with yourself.",
            });
          }
          return;
        }

        const result = await createOrGetRoom({ buyer_id: buyerId, product_id });
        if (stale()) return;
        setRoomData(result);
      }
    } catch (err) {
      if (stale()) return;
      const msg = friendlyErrorMessage(err, "Could not open this chat. Please try again.");
      setRoomError(msg);
      show({ variant: "error", title: "Chat error", message: msg });
    } finally {
      if (!stale()) setRoomLoading(false);
    }
  }, [asBuyer, sellerId, buyerId, product_id, otherUser, currentUserId, show]);

  const displayOtherUser = otherUserResolved ?? otherUser;
  const roomId = roomData?.id ?? 0;
  const hasExistingThread = Boolean(roomData?.last_message_at);
  const showChat = !roomLoading && !roomError && roomId > 0;

  useEffect(() => {
    if (!sheetOpen) return;
    fetchRoomData();
  }, [sheetOpen, fetchRoomData]);

  useEffect(() => {
    if (!sheetOpen || !showChat) setSheetFooter(null);
  }, [sheetOpen, showChat]);

  /**
   * A full-screen modal, not a bottom sheet.
   *
   * It was a @gorhom sheet at a 90% snap with keyboardBehavior="extend" and
   * the input in a BottomSheetFooter. Both halves of that fail for the same
   * reason the product forms did earlier in this project: a sheet already at
   * 90% has nowhere to extend to, and BottomSheetFooter positions against the
   * *sheet* rather than the keyboard -- so the input sat behind it and you
   * could not see what you were typing.
   *
   * The 10% it did not cover was the second problem. The home screen's header,
   * its shop row with "See all", and the tab bar all stayed visible around a
   * conversation, which is furniture from somewhere else framing a private
   * message.
   *
   * So: Modal + KeyboardAvoidingView, with the input bar a sibling of the
   * message list rather than a child of it. That is the arrangement that
   * already works for every input sheet in the app, and "above the keyboard"
   * becomes a layout fact instead of a calculation.
   */
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      presentationStyle="fullScreen"
    >
      {/* Its own provider: a Modal renders in a separate native window that
          the app-level SafeAreaProvider does not reach, so without this the
          insets are zero and the header sits under the status bar. */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SafeAreaView
          style={{ flex: 1, backgroundColor: t.surfacePage }}
          edges={["top", "left", "right"]}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View
              style={[
                styles.header,
                {
                  borderBottomColor: t.surfaceSunken,
                  backgroundColor: t.surfacePage,
                },
              ]}
            >
              <TouchableOpacity
                onPress={handleClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Close chat"
              >
                <ArrowLeft size={24} color={textColor} />
              </TouchableOpacity>
              <Avatar
                uri={pickProfilePicture(displayOtherUser)}
                name={displayOtherUser?.username}
                size={40}
              />
              <Text
                style={[styles.headerTitle, { color: textColor }]}
                numberOfLines={1}
              >
                {displayOtherUser?.username ?? "Chat"}
              </Text>
            </View>

            {hasExistingThread && showChat && (
              <Text className="text-xs text-center py-2 text-text-secondary">
                Continuing your conversation
              </Text>
            )}

            <View style={styles.body}>
              {roomLoading && (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color={textColor} />
                  <Text className="text-sm mt-3 text-text-secondary">
                    Opening chat…
                  </Text>
                </View>
              )}

              {!roomLoading && roomError && (
                <View style={styles.centered}>
                  <Text className="font-semibold text-center px-6 text-text-primary">
                    {roomError}
                  </Text>
                  <TouchableOpacity
                    className="mt-4 px-4 py-2 rounded bg-primary-fill"
                    onPress={() => fetchRoomData()}
                  >
                    <Text className="text-white font-semibold">Try again</Text>
                  </TouchableOpacity>
                </View>
              )}

              {showChat && (
                <ChatScreen
                  variant="sheet"
                  onClose={handleClose}
                  onSheetFooterReady={setSheetFooter}
                  route={{ params: { roomId, otherUser: displayOtherUser } }}
                  navigation={null}
                />
              )}
            </View>

            {/* Sibling of the list, inside the keyboard-avoiding view. This is
                the whole fix: the bar rises with the keyboard because the
                layout says so, not because anything measured it. */}
            {showChat && sheetFooter ? (
              <View style={{ paddingBottom: insets.bottom }}>{sheetFooter}</View>
            ) : null}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetRoot: {
    flex: 1,
    minHeight: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
});
