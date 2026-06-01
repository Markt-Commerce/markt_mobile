import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import ChatScreen from "./chat";
import { createOrGetRoom } from "../services/sections/chat";
import { getProductById } from "../services/sections/product";
import { ChatRoomLite } from "../models/chat";
import { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { useToast } from "./ToastProvider";
import { useUser } from "../hooks/userContextProvider";
import { isOwnProductListing } from "../utils/chatGuards";

type QuickChatBottomSheetProps = {
  /** Seller's user id (UUID) — used when current user is buyer (CHATS_API §1.2) */
  sellerId?: string;
  /** Buyer's user id — used when current user is seller */
  buyerId?: string;
  /** Product id — scopes room to product; also used to fetch seller user id when feed lacks it (§1.3) */
  product_id?: string;
  /** Other user info for chat header */
  otherUser?: { username?: string; profile_picture?: string };
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
  const snapPoints = useMemo(() => ["80%"], []);
  const { show } = useToast();
  const { user } = useUser();
  const currentUserId = user?.user_id?.toString() ?? "";
  const [sheetOpen, setSheetOpen] = useState(false);
  const [roomData, setRoomData] = useState<ChatRoomLite | null>(null);
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [otherUserResolved, setOtherUserResolved] = useState(otherUser);
  const fetchGenRef = useRef(0);

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

        if ((!resolvedSellerId || !looksLikeUserUuid(resolvedSellerId)) && product_id) {
          try {
            const product = await getProductById(product_id);
            if (stale()) return;
            const su = (product as any).seller_user ?? (product as any).seller?.user;
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
              show({ variant: "error", title: "Error", message: "Could not load product. Please try again." });
            }
            return;
          }
        }

        if (!resolvedSellerId) {
          if (!stale()) {
            setRoomError("Could not find seller.");
            show({ variant: "error", title: "Invalid data", message: "Could not find seller. Try opening the product first." });
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

        const result = await createOrGetRoom({ seller_id: resolvedSellerId, product_id });
        if (stale()) return;
        setRoomData(result);
      } else {
        if (!buyerId) {
          if (!stale()) {
            setRoomError("Buyer ID is required.");
            show({ variant: "error", title: "Invalid IDs", message: "Buyer ID must be provided." });
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
      const msg = err instanceof Error ? err.message : "Could not create chat room.";
      setRoomError(msg);
      show({ variant: "error", title: "Chat error", message: msg });
    } finally {
      if (!stale()) setRoomLoading(false);
    }
  }, [asBuyer, sellerId, buyerId, product_id, otherUser, currentUserId, show]);

  useEffect(() => {
    if (!sheetOpen) return;
    fetchRoomData();
  }, [sheetOpen, fetchRoomData]);

  const displayOtherUser = otherUserResolved ?? otherUser;
  const roomId = roomData?.id ?? 0;
  const hasExistingThread = Boolean(roomData?.last_message_at);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={handleSheetChange}
    >
      <BottomSheetView className="flex-1 p-2">
        {roomLoading && (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color="#000000" />
            <Text className="text-tertiary text-sm mt-3">Opening chat…</Text>
          </View>
        )}
        {!roomLoading && roomError && (
          <View className="flex-1 items-center justify-center py-12 px-6">
            <Text className="text-black font-semibold text-center">{roomError}</Text>
            <TouchableOpacity
              className="mt-4 px-4 py-2 rounded bg-primary"
              onPress={() => fetchRoomData()}
            >
              <Text className="text-white font-semibold">Try again</Text>
            </TouchableOpacity>
          </View>
        )}
        {!roomLoading && !roomError && roomId > 0 && (
          <>
            {hasExistingThread && (
              <Text className="text-tertiary text-xs text-center pb-2">
                Continuing your conversation
              </Text>
            )}
            <ChatScreen
              route={{ params: { roomId, otherUser: displayOtherUser } }}
              navigation={null}
            />
          </>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}
