import React, { useEffect, useMemo, useState } from "react";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import ChatScreen from "./chat";
import { createOrGetRoom } from "../services/sections/chat";
import { getProductById } from "../services/sections/product";
import { ChatRoomLite } from "../models/chat";
import { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { useToast } from "./ToastProvider";

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
  const [roomData, setRoomData] = useState<ChatRoomLite | null>(null);
  const [otherUserResolved, setOtherUserResolved] = useState(otherUser);

  useEffect(() => {
    setOtherUserResolved(otherUser);
  }, [otherUser]);

  useEffect(() => {
    let cancelled = false;

    const fetchRoomData = async () => {
      setRoomData(null); // reset so we don't show stale room when product/seller changes
      if (asBuyer) {
        // Buyer flow: need seller_id (user UUID, not seller account id)
        let resolvedSellerId = sellerId;
        let resolvedOtherUser = otherUser;

        // Feed products often lack seller.user.id; fetch product detail per CHATS_API §1.3
        if ((!resolvedSellerId || !looksLikeUserUuid(resolvedSellerId)) && product_id) {
          try {
            const product = await getProductById(product_id);
            if (cancelled) return;
            const su = (product as any).seller_user ?? (product as any).seller?.user;
            resolvedSellerId = su?.id ? String(su.id) : resolvedSellerId;
            if (su && !resolvedOtherUser) {
              resolvedOtherUser = { username: su.username, profile_picture: su.profile_picture ?? su.profile_picture_url };
            }
            setOtherUserResolved(resolvedOtherUser);
          } catch (e) {
            if (!cancelled) show({ variant: "error", title: "Error", message: "Could not load product. Please try again." });
            return;
          }
        }

        if (!resolvedSellerId) {
          show({ variant: "error", title: "Invalid data", message: "Could not find seller. Try opening the product first." });
          return;
        }

        try {
          const result = await createOrGetRoom({ seller_id: resolvedSellerId, product_id });
          if (cancelled) return;
          setRoomData(result);
        } catch (err) {
          if (cancelled) return;
          const msg = err instanceof Error ? err.message : "Could not create chat room.";
          show({ variant: "error", title: "Chat error", message: msg });
        }
      } else {
        // Seller flow: need buyer_id
        if (!buyerId) {
          show({ variant: "error", title: "Invalid IDs", message: "Buyer ID must be provided." });
          return;
        }
        try {
          const result = await createOrGetRoom({ buyer_id: buyerId, product_id });
          if (cancelled) return;
          setRoomData(result);
        } catch (err) {
          if (cancelled) return;
          const msg = err instanceof Error ? err.message : "Could not create chat room.";
          show({ variant: "error", title: "Chat error", message: msg });
        }
      }
    };

    fetchRoomData();
    return () => { cancelled = true; };
  }, [sellerId, buyerId, product_id, asBuyer, show]);

  const displayOtherUser = otherUserResolved ?? otherUser;

  return (
    <BottomSheet ref={sheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose>
      <BottomSheetView className="flex-1 p-2">
        <ChatScreen
          route={{ params: { roomId: roomData ? roomData.id : 0, otherUser: displayOtherUser } }}
          navigation={null}
        />
      </BottomSheetView>
    </BottomSheet>
  );
}
