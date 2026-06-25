import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import BottomSheet, {
  BottomSheetFooter,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import type { BottomSheetFooterProps } from "@gorhom/bottom-sheet";
import { ArrowLeft } from "lucide-react-native";
import ChatScreen from "./chat";
import Avatar from "./Avatar";
import { createOrGetRoom } from "../services/sections/chat";
import { runMessageSellerFlow } from "../utils/messageSellerFlow";
import { getProductById } from "../services/sections/product";
import { ChatRoomLite } from "../models/chat";
import { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { useToast } from "./ToastProvider";
import { useUser } from "../hooks/userContextProvider";
import { isOwnProductListing } from "../utils/chatGuards";
import { useTheme } from "./themeProvider";
import { pickProfilePicture, type ChatOtherUser } from "../utils/chatAvatar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const snapPoints = useMemo(() => ["90%"], []);
  const { show } = useToast();
  const { user } = useUser();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const textColor = isDark ? "#f5f5f5" : "#000000";
  const currentUserId = user?.user_id?.toString() ?? "";
  const [sheetOpen, setSheetOpen] = useState(false);
  const [roomData, setRoomData] = useState<ChatRoomLite | null>(null);
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [otherUserResolved, setOtherUserResolved] = useState(otherUser);
  const fetchGenRef = useRef(0);
  const [sheetFooter, setSheetFooter] = useState<React.ReactNode>(null);
  const insets = useSafeAreaInsets();

  const handleClose = useCallback(() => {
    sheetRef.current?.close();
  }, [sheetRef]);

  const handleSheetChange = useCallback((index: number) => {
    setSheetOpen(index >= 0);
    if (index < 0) {
      fetchGenRef.current += 1;
      setRoomData(null);
      setRoomLoading(false);
      setRoomError(null);
    }
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
      const msg =
        err instanceof Error ? err.message : "Could not create chat room.";
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

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={insets.bottom}>
        {sheetFooter}
      </BottomSheetFooter>
    ),
    [sheetFooter, insets.bottom],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={handleSheetChange}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      footerComponent={showChat ? renderFooter : undefined}
      backgroundStyle={{ backgroundColor: isDark ? "#1a1c1d" : "#FFFFFF" }}
      handleIndicatorStyle={{ backgroundColor: isDark ? "#46464e" : "#E4E4E7" }}
    >
      <BottomSheetView style={styles.sheetRoot}>
        {/* Fixed header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: isDark ? "#2a2a2e" : "#efe9e7",
              backgroundColor: isDark ? "#1a1c1d" : "#FFFFFF",
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.backButton}
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
          <Text
            className={`text-xs text-center py-2 ${isDark ? "text-dark-muted" : "text-tertiary"}`}
          >
            Continuing your conversation
          </Text>
        )}

        {/* Message list area — flex: 1 */}
        <View style={styles.body}>
          {roomLoading && (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={textColor} />
              <Text
                className={`text-sm mt-3 ${isDark ? "text-dark-muted" : "text-tertiary"}`}
              >
                Opening chat…
              </Text>
            </View>
          )}

          {!roomLoading && roomError && (
            <View style={styles.centered}>
              <Text
                className={`font-semibold text-center px-6 ${isDark ? "text-dark-text" : "text-black"}`}
              >
                {roomError}
              </Text>
              <TouchableOpacity
                className="mt-4 px-4 py-2 rounded bg-primary"
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
      </BottomSheetView>
    </BottomSheet>
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
