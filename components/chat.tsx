/**
 * ChatScreen — 1:1 conversation
 * CHATS_API_AND_SOCKETS.md §2, §3
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Alert,
} from "react-native";
import { ArrowLeft, Plus, Send, SmilePlus } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import chatSocket from "../services/chatSock";
import {
  getRoomMessages,
  markRoomRead,
  getReactions,
  addReaction,
  removeReaction,
  sendProductMessageMock,
  getRoomDiscounts,
  respondToDiscount,
} from "../services/sections/chat";
import { ChatMessage } from "../models/chat";
import { addToCart } from "../services/sections/cart";
import { useUser } from "../hooks/userContextProvider";
import { useToast } from "./ToastProvider";
import ProductPicker from "./productPicker";
import ChatAttachmentSheet from "./chatAttachmentSheet";
import { attemptMultipleUpload } from "../services/sections/media";
import ChatProductDisplayComponent from "./chatProductDisplayComponent";
import Avatar from "./Avatar";
import type { ProductResponse } from "../models/products";
import { getSellerProducts, getMyProducts } from "../services/sections/product";
import { COMMON_REACTIONS, getEmoji, type ReactionType } from "../utils/reactions";

export type ChatProps = {
  route: {
    params: {
      roomId: number;
      otherUser?: { username?: string; profile_picture?: string; user_id?: string };
    };
  };
  navigation: any;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ChatScreen({ route }: ChatProps) {
  const { user, role } = useUser();
  const { roomId, otherUser } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const router = useRouter();
  const { show } = useToast();

  const [attachmentVisible, setAttachmentVisible] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [productVisible, setProductVisible] = useState(false);
  const [productList, setProductList] = useState<ProductResponse[]>([]);
  const [currentProductIds, setCurrentProductIds] = useState<string[]>([]);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);

  const myId = user?.user_id?.toString() ?? "";
  const PER_PAGE = 30;

  /** Display order: oldest first (chronological). API may return desc; we sort by created_at asc. */
  const sortedMessages = React.useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [messages]);

  const loadInitial = async () => {
    setLoading(true);
    try {
      if (!roomId || roomId === 0) return;
      const res = await getRoomMessages(roomId, 1, PER_PAGE);
      const list = res.messages ?? [];
      // Fetch reactions for messages with numeric id (CHAT_MESSAGE_REACTIONS §1.2)
      const numericMsgs = list.filter((m) => !isNaN(Number(m.id)) && Number(m.id) > 0);
      const reactionPromises = numericMsgs.slice(0, 20).map(async (m) => {
        try {
          const reactions = await getReactions(Number(m.id));
          return { id: m.id, reactions: reactions ?? [] };
        } catch {
          return { id: m.id, reactions: [] };
        }
      });
      const reactionResults = await Promise.all(reactionPromises);
      const reactionMap = new Map(reactionResults.map((r) => [r.id, r.reactions]));
      const enriched = list.map((m) => {
        const rx = reactionMap.get(m.id);
        if (!rx || rx.length === 0) return m;
        return {
          ...m,
          message_data: { ...m.message_data, reactions: rx },
        };
      });
      setMessages(enriched);
      setPage(2);
      const total = res.pagination?.total ?? 0;
      setHasMore(list.length < total);
      await markRoomRead(roomId);
    } catch {
      show({ variant: "error", title: "Error", message: "Could not load messages." });
    } finally {
      setLoading(false);
    }
  };

  const loadOlder = async () => {
    if (loadingOlder || !hasMore || !roomId) return;
    setLoadingOlder(true);
    try {
      const res = await getRoomMessages(roomId, page, PER_PAGE);
      const list = res.messages ?? [];
      if (list.length > 0) {
        const numericMsgs = list.filter((m) => !isNaN(Number(m.id)) && Number(m.id) > 0);
        const reactionPromises = numericMsgs.slice(0, 20).map(async (m) => {
          try {
            const reactions = await getReactions(Number(m.id));
            return { id: m.id, reactions: reactions ?? [] };
          } catch {
            return { id: m.id, reactions: [] };
          }
        });
        const reactionResults = await Promise.all(reactionPromises);
        const reactionMap = new Map(reactionResults.map((r) => [r.id, r.reactions]));
        const enriched = list.map((m) => {
          const rx = reactionMap.get(m.id);
          if (!rx || rx.length === 0) return m;
          return { ...m, message_data: { ...m.message_data, reactions: rx } };
        });
        setMessages((prev) => [...enriched, ...prev]);
        setPage((p) => p + 1);
      }
      const total = res.pagination?.total ?? 0;
      setHasMore(list.length === PER_PAGE && page * PER_PAGE < total);
    } catch {
      show({ variant: "error", title: "Error", message: "Could not load older messages." });
    } finally {
      setLoadingOlder(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, [roomId]);

  useEffect(() => {
    chatSocket.connect();
    const offMsg = chatSocket.onMessage(onSocketMessage);
    const offTyping = chatSocket.onTyping(onTypingUpdate);
    chatSocket.onStatus(() => {});

    chatSocket.joinRoom(roomId, myId);

    return () => {
      offMsg();
      offTyping();
      chatSocket.leaveRoom(roomId, myId);
    };
  }, [roomId, myId]);

  function onSocketMessage(msg: ChatMessage) {
    if (msg.room_id !== roomId) return;
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id || (m.client_id && m.client_id === (msg as any).client_id))) {
        return prev.map((m) =>
          m.client_id && (msg as any).client_id && m.client_id === (msg as any).client_id
            ? { ...msg, pending: false, client_id: undefined }
            : m
        );
      }
      return [...prev, msg];
    });
    markRoomRead(roomId).catch(() => {});
    setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
  }

  const handleRespondToOffer = async (offerId: number, response: "accept" | "reject") => {
    try {
      await chatSocket.respondToOffer({ offer_id: offerId, response, user_id: myId });
      show({ variant: "success", title: "Offer", message: response === "accept" ? "Offer accepted." : "Offer declined." });
    } catch {
      show({ variant: "error", title: "Error", message: "Could not respond to offer." });
    }
  };

  function onTypingUpdate(update: any) {
    if (update.room_id !== roomId) return;
    if (update.action === "start") setTypingUser(update.username ?? "Someone");
    else setTypingUser(null);
    if (update.action === "start") setTimeout(() => setTypingUser(null), 2500);
  }

  async function handleSendText() {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    try {
      const success = await chatSocket.sendText(roomId, myId, content);
      const temp: ChatMessage = {
        id: `c_${myId}`,
        room_id: roomId,
        sender_id: myId,
        content,
        message_type: "text",
        message_data: null,
        is_read: false,
        created_at: new Date().toISOString(),
        pending: !success,
      };
      setMessages((prev) => [...prev, temp]);
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
    } catch {
      show({ variant: "error", title: "Error", message: "Could not send message." });
    } finally {
      setSending(false);
    }
  }

  async function handlePickMedia(kind: "image" | "video") {
    try {
      const perms = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perms.granted) {
        Alert.alert("Permission required", "We need permission to access your photos.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: kind === "image" ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
        quality: 0.8,
      });
      if (res.canceled) return;
      const uri = res.assets?.[0]?.uri;
      const uploadResult = await attemptMultipleUpload(
        res.assets!.map((a) => ({ id: a?.assetId || "", uri: a?.uri || "" }))
      );
      for (const result of uploadResult) {
        const isImage = kind === "image";
        await (isImage ? chatSocket.sendImage : chatSocket.sendVideo)(
          roomId,
          myId,
          result.media?.original_url || result.urls?.["original"] || uri!,
          { localUri: uri }
        );
        const temp: ChatMessage = {
          id: `c_${Date.now()}`,
          room_id: roomId,
          sender_id: myId,
          content: result.media?.original_url || uri!,
          message_type: kind,
          message_data: { url: result.media?.original_url },
          is_read: false,
          created_at: new Date().toISOString(),
          pending: true,
        };
        setMessages((prev) => [...prev, temp]);
      }
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
    } catch {
      show({ variant: "error", title: "Error", message: "Could not send media." });
    }
  }

  async function openProductPicker() {
    setAttachmentVisible(false);
    Keyboard.dismiss();
    setProductVisible(true);
    if (productList.length === 0) {
      setProductLoading(true);
      try {
        const products = await getMyProducts(1, 30);
        if (products.length === 0) {
          const fallback = await getSellerProducts(Number(user?.user_id) || 0);
          setProductList(fallback);
        } else {
          setProductList(products);
        }
      } catch {
        try {
          const fallback = await getSellerProducts(Number(user?.user_id) || 0);
          setProductList(fallback);
        } catch {
          show({ variant: "error", title: "Error", message: "Could not load products." });
        }
      } finally {
        setProductLoading(false);
      }
    }
  }

  function openAttachmentSheet() {
    Keyboard.dismiss();
    setAttachmentVisible(true);
  }

  async function handleCamera() {
    try {
      const perms = await ImagePicker.requestCameraPermissionsAsync();
      if (!perms.granted) {
        Alert.alert("Permission required", "We need camera access to take photos.");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
      if (res.canceled) return;
      const uri = res.assets?.[0]?.uri;
      const uploadResult = await attemptMultipleUpload(res.assets!.map((a) => ({ id: a?.assetId || "", uri: a?.uri || "" })));
      for (const result of uploadResult) {
        await chatSocket.sendImage(roomId, myId, result.media?.original_url || result.urls?.["original"] || uri!, { localUri: uri });
        const temp: ChatMessage = {
          id: `c_${Date.now()}`,
          room_id: roomId,
          sender_id: myId,
          content: result.media?.original_url || uri!,
          message_type: "image",
          message_data: { url: result.media?.original_url },
          is_read: false,
          created_at: new Date().toISOString(),
          pending: true,
        };
        setMessages((prev) => [...prev, temp]);
      }
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
    } catch {
      show({ variant: "error", title: "Error", message: "Could not send photo." });
    }
  }

  function handleRequests() {
    show({ variant: "info", title: "Requests", message: "Share a request from the Requests tab." });
  }

  const [discountVisible, setDiscountVisible] = useState(false);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [discountLoading, setDiscountLoading] = useState(false);

  async function handleDiscounts() {
    setDiscountVisible(true);
    setDiscountLoading(true);
    try {
      const list = await getRoomDiscounts(roomId);
      setDiscounts(list ?? []);
    } catch {
      setDiscounts([]);
      show({ variant: "error", title: "Error", message: "Could not load discounts." });
    } finally {
      setDiscountLoading(false);
    }
  }

  async function handleRespondToDiscount(discountId: number, response: "accepted" | "rejected") {
    try {
      await respondToDiscount(discountId, { response });
      setDiscounts((prev) => prev.filter((d) => d.id !== discountId));
      show({ variant: "success", title: "Discount", message: response === "accepted" ? "Discount accepted." : "Discount declined." });
    } catch {
      show({ variant: "error", title: "Error", message: "Could not respond to discount." });
    }
  }

  async function sendSelectedProducts() {
    if (currentProductIds.length === 0) return;
    setSending(true);
    try {
      for (const product_id of currentProductIds) {
        const mock = await sendProductMessageMock(roomId, myId, product_id);
        setMessages((prev) => [...prev, { ...mock, pending: false }]);
        await chatSocket.sendProduct(roomId, myId, product_id, "Sharing product");
      }
      setCurrentProductIds([]);
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
    } catch {
      show({ variant: "error", title: "Error", message: "Could not share product." });
    } finally {
      setSending(false);
    }
  }

  /** Get reaction summaries for display; fallback to legacy reactions_count/hasReactedClient for THUMBS_UP */
  function getReactionSummaries(m: ChatMessage): { reaction_type: string; emoji: string; count: number; has_reacted: boolean }[] {
    const rx = m.message_data?.reactions;
    if (Array.isArray(rx) && rx.length > 0) return rx.filter((r) => r.count > 0);
    const legacy = (m as any).hasReactedClient ?? false;
    const count = m.message_data?.reactions_count ?? 0;
    if (count > 0 || legacy) return [{ reaction_type: "THUMBS_UP", emoji: "👍", count: count || (legacy ? 1 : 0), has_reacted: legacy }];
    return [];
  }

  async function handleAddReaction(message: ChatMessage, reactionType: ReactionType) {
    const msgId = Number(message.id);
    if (isNaN(msgId) || msgId <= 0) return;
    const rx = message.message_data?.reactions ?? [];
    const existing = rx.find((r) => r.reaction_type === reactionType);
    if (existing?.has_reacted) return; // already have it; API is idempotent
    setReactionPickerFor(null);
    try {
      await addReaction(msgId, reactionType);
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== message.id) return m;
          const rxn = m.message_data?.reactions ?? [];
          const idx = rxn.findIndex((r) => r.reaction_type === reactionType);
          let next: typeof rxn;
          if (idx >= 0) next = rxn.map((r, i) => (i === idx ? { ...r, count: r.count + 1, has_reacted: true } : r));
          else next = [...rxn, { reaction_type: reactionType, emoji: getEmoji(reactionType), count: 1, has_reacted: true }];
          return { ...m, message_data: { ...m.message_data, reactions: next } };
        })
      );
    } catch {
      show({ variant: "error", title: "Error", message: "Could not add reaction." });
    }
  }

  async function handleRemoveReaction(message: ChatMessage, reactionType: ReactionType) {
    const msgId = Number(message.id);
    if (isNaN(msgId) || msgId <= 0) return;
    setReactionPickerFor(null);
    try {
      await removeReaction(msgId, reactionType);
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== message.id) return m;
          const rx = m.message_data?.reactions ?? [];
          const idx = rx.findIndex((r) => r.reaction_type === reactionType);
          if (idx < 0) return m;
          const r = rx[idx];
          const next = r.count <= 1 ? rx.filter((_, i) => i !== idx) : rx.map((re, i) => (i === idx ? { ...re, count: re.count - 1, has_reacted: false } : re));
          return { ...m, message_data: { ...m.message_data, reactions: next } };
        })
      );
    } catch {
      show({ variant: "error", title: "Error", message: "Could not remove reaction." });
    }
  }

  function handleReactionTap(message: ChatMessage, r: { reaction_type: string; count: number; has_reacted: boolean }) {
    if (r.has_reacted) handleRemoveReaction(message, r.reaction_type as ReactionType);
    else handleAddReaction(message, r.reaction_type as ReactionType);
  }

  async function handleAddProductToCart(productId?: string) {
    if (!productId) return;
    try {
      await addToCart({ product_id: productId, variant_id: 0, quantity: 1 });
      show({ variant: "success", title: "Success", message: "Product added to cart." });
    } catch {
      show({ variant: "error", title: "Error", message: "Could not add to cart." });
    }
  }

  function renderMessage({ item }: { item: ChatMessage }) {
    const isMe = item.sender_id === myId || String(item.sender_id) === myId;

    return (
      <View className={`flex-row px-4 py-1.5 ${isMe ? "justify-end" : "justify-start"}`}>
        {!isMe && (
          <View className="mr-2 mt-1">
            <Avatar uri={(item as any).sender?.profile_picture} name={(item as any).sender?.username} size={32} />
          </View>
        )}
        <View className={`max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
          {item.message_type === "text" && (
            <View
              className={`px-4 py-3 rounded-2xl ${isMe ? "rounded-br-md bg-primary" : "rounded-bl-md bg-white border border-border"}`}
            >
              <Text className={`text-base ${isMe ? "text-white" : "text-text-primary"}`}>{item.content}</Text>
            </View>
          )}

          {item.message_type === "image" && (
            <TouchableOpacity activeOpacity={0.9}>
              <Image
                source={{ uri: item.content || item.message_data?.url }}
                className="w-56 h-40 rounded-2xl bg-bg-muted"
                resizeMode="cover"
              />
              {item.pending && (
                <Text className="text-text-secondary text-xs mt-1">Sending…</Text>
              )}
            </TouchableOpacity>
          )}

          {item.message_type === "video" && (
            <View className="w-56 h-40 rounded-2xl bg-black items-center justify-center">
              <Text className="text-white">Video</Text>
            </View>
          )}

          {item.message_type === "product" && (
            <ChatProductDisplayComponent
              productId={item.message_data?.product_id ? String(item.message_data.product_id) : undefined}
              embeddedProduct={item.message_data?.product}
              showAddToCart={role === "buyer"}
              onAddToCart={handleAddProductToCart}
            />
          )}

          {item.message_type === "offer" && (
            <View className="rounded-2xl overflow-hidden border border-border bg-white min-w-[200px]">
              <View className="px-4 py-3 bg-[#f8f8f8]">
                <Text className="text-text-secondary text-xs font-medium uppercase tracking-wide">Price offer</Text>
                <Text className="text-text-primary text-lg font-bold mt-0.5">
                  ₦{Number((item as any).offer?.price ?? (item as any).offer?.offer_amount ?? item.content ?? 0).toLocaleString()}
                </Text>
                {(item as any).offer?.message && (
                  <Text className="text-text-secondary text-sm mt-1" numberOfLines={2}>{(item as any).offer.message}</Text>
                )}
              </View>
              {role === "buyer" && (item as any).offer?.status === "pending" && (item as any).offer?.id && (
                <View className="flex-row p-2 gap-2">
                  <TouchableOpacity
                    onPress={() => handleRespondToOffer(Number((item as any).offer.id), "accept")}
                    className="flex-1 py-2.5 rounded-xl bg-primary items-center"
                  >
                    <Text className="text-white font-semibold text-sm">Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRespondToOffer(Number((item as any).offer.id), "reject")}
                    className="flex-1 py-2.5 rounded-xl bg-[#efefef] items-center"
                  >
                    <Text className="text-text-primary font-semibold text-sm">Decline</Text>
                  </TouchableOpacity>
                </View>
              )}
              {(item as any).offer?.status && (item as any).offer?.status !== "pending" && (
                <View className="px-4 py-2">
                  <Text className="text-text-secondary text-xs capitalize">{(item as any).offer.status}</Text>
                </View>
              )}
            </View>
          )}

          <View className="flex-row items-center mt-1.5 gap-2 flex-wrap">
            <Text className="text-text-secondary text-[11px]">{formatTime(item.created_at)}</Text>
            {!isNaN(Number(item.id)) && Number(item.id) > 0 && (
              <>
                {getReactionSummaries(item).map((r) => (
                  <TouchableOpacity
                    key={r.reaction_type}
                    onPress={() => handleReactionTap(item, r)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="flex-row items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-bg-muted/70"
                  >
                    <Text className="text-sm">{r.emoji}</Text>
                    {r.count > 1 && (
                      <Text className={`text-[11px] ${r.has_reacted ? "text-primary font-medium" : "text-text-secondary"}`}>
                        {r.count}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => setReactionPickerFor(reactionPickerFor === String(item.id) ? null : String(item.id))}
                  onLongPress={() => setReactionPickerFor(String(item.id))}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="p-1"
                >
                  <SmilePlus size={14} color="#876d64" />
                </TouchableOpacity>
                {reactionPickerFor === String(item.id) && (
                  <View className="flex-row gap-1 mt-0.5">
                    {COMMON_REACTIONS.map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => handleAddReaction(item, type)}
                        className="px-2 py-1 rounded-full bg-bg-muted"
                      >
                        <Text className="text-base">{getEmoji(type)}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      onPress={() => setReactionPickerFor(null)}
                      className="px-2 py-1 rounded-full bg-bg-muted"
                    >
                      <Text className="text-xs text-text-secondary">✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
          {item.pending && (
            <Text className="text-text-secondary text-[10px] mt-0.5">Pending…</Text>
          )}
        </View>
        {isMe && (
          <View className="ml-2 mt-1">
            <Avatar uri={null} name={user?.email} size={32} />
          </View>
        )}
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-elevated">
        <ActivityIndicator size="large" color="#e26136" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg-elevated"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={24} color="#171311" />
        </TouchableOpacity>
        <Avatar uri={otherUser?.profile_picture} name={otherUser?.username} size={40} />
        <Text className="ml-3 text-text-primary font-semibold text-base flex-1" numberOfLines={1}>
          {otherUser?.username ?? "Chat"}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={sortedMessages}
        keyExtractor={(it) => String(it.id)}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
          const padding = 80;
          if (contentOffset.y < padding && hasMore && !loadingOlder) loadOlder();
        }}
        scrollEventThrottle={400}
        ListHeaderComponent={
          hasMore && (loadingOlder ? (
            <View className="py-3 items-center">
              <ActivityIndicator size="small" color="#e26136" />
            </View>
          ) : null)
        }
      />

      {typingUser && (
        <View className="px-4 py-2 flex-row items-center">
          <View className="flex-row gap-1 px-3 py-2 rounded-full bg-[#efefef] self-start">
            <View className="w-2 h-2 rounded-full bg-text-secondary opacity-60" />
            <View className="w-2 h-2 rounded-full bg-text-secondary opacity-80" />
            <View className="w-2 h-2 rounded-full bg-text-secondary" />
          </View>
          <Text className="text-text-secondary text-sm ml-2">{typingUser} is typing</Text>
        </View>
      )}

      {/* Input bar — send button aligned with input; keyboard dismissed when opening attachment sheet */}
      <View className="flex-row items-center px-4 py-2 pb-2 bg-white border-t border-border gap-2 min-h-[52px]">
        <View className="flex-1 flex-row items-center bg-bg-muted rounded-full pl-4 pr-1 py-1.5 h-11">
          <TextInput
            value={input}
            onChangeText={(t) => {
              setInput(t);
              chatSocket.typingStart(roomId, myId);
            }}
            placeholder="Type a message…"
            placeholderTextColor="#876d64"
            className="flex-1 text-text-primary text-base min-h-[24px] max-h-[80px]"
            multiline
            maxLength={1000}
            textAlignVertical="center"
          />
          <TouchableOpacity onPress={openAttachmentSheet} className="p-2">
            <Plus size={22} color="#876d64" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={handleSendText}
          disabled={sending}
          className="w-11 h-11 rounded-full bg-primary items-center justify-center"
        >
          <Send size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ChatAttachmentSheet
        visible={attachmentVisible}
        onClose={() => setAttachmentVisible(false)}
        onCamera={handleCamera}
        onPhotos={() => handlePickMedia("image")}
        onProducts={role === "seller" ? openProductPicker : undefined}
        onRequests={role === "buyer" ? handleRequests : undefined}
        onDiscounts={handleDiscounts}
        role={role}
      />
      {discountVisible && (
        <View className="absolute inset-0 z-[1000] bg-black/40 justify-end">
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setDiscountVisible(false)} activeOpacity={1} />
          <View className="bg-white rounded-t-3xl max-h-[50%] px-4 pt-4 pb-10">
            <View className="flex-row justify-between mb-4">
              <Text className="text-text-primary font-semibold text-base">Active discounts</Text>
              <TouchableOpacity onPress={() => setDiscountVisible(false)}>
                <Text className="text-primary font-semibold">Done</Text>
              </TouchableOpacity>
            </View>
            {discountLoading ? (
              <ActivityIndicator size="small" color="#e26136" />
            ) : discounts.length === 0 ? (
              <Text className="text-text-secondary text-sm">No active discounts for this chat.</Text>
            ) : (
              discounts.map((d) => (
                <View key={d.id} className="bg-bg-muted rounded-xl p-3 mb-2">
                  <Text className="text-text-primary font-medium text-sm">{d.discount_message ?? d.discount_type ?? "Discount"}</Text>
                  <Text className="text-primary font-semibold text-sm mt-1">₦{Number(d.discount_value ?? 0).toLocaleString()}</Text>
                  {role === "buyer" && (d.status === "pending" || !d.status) && (
                    <View className="flex-row gap-2 mt-2">
                      <TouchableOpacity
                        onPress={() => handleRespondToDiscount(d.id, "accepted")}
                        className="flex-1 py-2 rounded-lg bg-primary items-center"
                      >
                        <Text className="text-white font-semibold text-sm">Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRespondToDiscount(d.id, "rejected")}
                        className="flex-1 py-2 rounded-lg bg-[#efefef] items-center"
                      >
                        <Text className="text-text-primary font-semibold text-sm">Decline</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      )}
      <ProductPicker
        visible={productVisible}
        products={productList}
        loading={productLoading}
        selectedProducts={productList.filter((p) => currentProductIds.includes(p.id))}
        onClose={() => {
          if (currentProductIds.length > 0) sendSelectedProducts();
          setProductVisible(false);
          setCurrentProductIds([]);
        }}
        onSelect={(product) => {
          if (!currentProductIds.includes(product.id)) setCurrentProductIds((prev) => [...prev, product.id]);
        }}
        onRemove={(product) => setCurrentProductIds((prev) => prev.filter((id) => id !== product.id))}
      />
    </KeyboardAvoidingView>
  );
}
