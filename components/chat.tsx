/**
 * ChatScreen — 1:1 conversation
 */

import React, { useCallback, useEffect, useRef, useState, useLayoutEffect } from "react";
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
  StyleSheet,
} from "react-native";
import {
  ArrowLeft,
  Check,
  DollarSign,
  Eye,
  Flame,
  Hand,
  Heart,
  Plus,
  Rocket,
  Send,
  ShoppingCart,
  Smile,
  SmilePlus,
  Star,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import chatSocket from "../services/chatSock";
import {
  getRoomMessages,
  markRoomRead,
  getReactions,
  addReaction,
  removeReaction,
  sendProductMessage,
  sendMessageREST,
  getRoomDiscounts,
  respondToDiscount,
  createRoomDiscount,
} from "../services/sections/chat";
import { ChatMessage } from "../models/chat";
import { addToCart } from "../services/sections/cart";
import { useUser } from "../hooks/userContextProvider";
import { useToast } from "./ToastProvider";
import ProductPicker from "./productPicker";
import RequestPicker from "./requestPicker";
import ChatAttachmentSheet from "./chatAttachmentSheet";
import DiscountOfferSheet from "./chat/DiscountOfferSheet";
import type { BuyerRequest } from "../models/feed";
import { getBuyerRequests } from "../services/sections/feed";
import { attemptMultipleUpload } from "../services/sections/media";
import ChatProductDisplayComponent from "./chatProductDisplayComponent";
import Avatar from "./Avatar";
import type { ProductResponse } from "../models/products";
import { getSellerProducts, getMyProducts } from "../services/sections/product";
import { COMMON_REACTIONS, type ReactionType } from "../utils/reactions";
import {
  attachReactionsToMessages,
  applyReactionAdded,
  applyReactionRemoved,
  applyReactionStats,
  fetchReactionsForMessages,
  normalizeReactionSummaries,
} from "../utils/chatReactions";
import {
  enrichChatMessage,
  getMessageAvatarProps,
  pickProfilePicture,
  type ChatOtherUser,
} from "../utils/chatAvatar";
import { normalizeUri, resolveProductImageUri } from "../utils/imageUri";
import { getUserProfile } from "../services/sections/profile";
import { useTheme } from "./themeProvider";
import { useTokens } from "../theme/useTokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboardOverlap } from "../hooks/useKeyboardOverlap";
import { InlineVideo, MediaViewerModal } from "./postMedia";
import {
  formatDate as watDate,
  formatTime as watTime,
  isSameWatDay,
  parseServerDate,
} from "../utils/datetime";

export type ChatScreenVariant = "screen" | "sheet";

export type ChatProps = {
  route: {
    params: {
      roomId: number;
      otherUser?: ChatOtherUser & { user_id?: string };
    };
  };
  navigation: any;
  /** `sheet` = embedded in QuickChatBottomSheet (no header, bottom-sheet keyboard) */
  variant?: ChatScreenVariant;
  onClose?: () => void;
  /** Sheet mode: input bar rendered in parent BottomSheet footer (keyboard-safe) */
  onSheetFooterReady?: (footer: React.ReactNode) => void;
};

const reactionIcons: Record<
  string,
  React.ComponentType<{ size?: number; color?: string }>
> = {
  THUMBS_UP: ThumbsUp,
  THUMBS_DOWN: ThumbsDown,
  HEART: Heart,
  FIRE: Flame,
  STAR: Star,
  MONEY: DollarSign,
  SHOPPING: ShoppingCart,
  CHECK: Check,
  EYES: Eye,
  CLAP: Hand,
  ROCKET: Rocket,
  SMILE: Smile,
};

function getReactionIcon(type: string) {
  return reactionIcons[type] ?? Smile;
}

/**
 * Whether two messages belong to the same visual run.
 *
 * Same sender, same minute. A burst of five messages then renders as one block
 * with a single avatar and a single timestamp, instead of five avatars and five
 * timestamps stacked down the screen -- which is most of what made the thread
 * feel sparse and repetitive.
 */
function isSameGroup(a?: ChatMessage, b?: ChatMessage) {
  if (!a || !b) return false;
  if (String(a.sender_id) !== String(b.sender_id)) return false;
  const ta = parseServerDate(a.created_at);
  const tb = parseServerDate(b.created_at);
  if (!ta || !tb) return false;
  // Same minute, same sender — the whole grouping rule. Compared as instants
  // rather than as local fields, so it no longer depends on the device zone.
  return Math.floor(ta.getTime() / 60_000) === Math.floor(tb.getTime() / 60_000);
}

function formatTime(iso: string) {
  // Today gets a bare clock time; anything older carries its date, and both
  // read in Lagos time whatever zone the phone is in.
  return isSameWatDay(iso, new Date())
    ? watTime(iso)
    : `${watDate(iso)}, ${watTime(iso)}`;
}

/** User-facing text above a product card (excludes bare product ids / share labels). */
function productMessageCaption(content: string | undefined, productId?: string): string | null {
  const text = (content ?? "").trim();
  if (!text) return null;
  if (text === productId) return null;
  if (/^PRD_[\w]+$/.test(text)) return null;
  if (text === "Sharing product") return null;
  return text;
}

export default function ChatScreen({
  route,
  variant = "screen",
  onClose,
  onSheetFooterReady,
}: ChatProps) {
  const embedInSheet = variant === "sheet";
  const { user, role } = useUser();
  const { roomId, otherUser } = route.params;
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  // Ref guard, not state — onScroll fires far more often than onEndReached,
  // so multiple calls can see loadingOlder still false before the state update
  // flushes, letting two of them fetch the same page and prepend duplicate
  // ids (causing the FlatList "same key" error).
  const loadingOlderRef = useRef(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const router = useRouter();
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const t = useTokens();
  const textColor = t.textPrimary;
  const mutedColor = t.textSecondary;

  const [attachmentVisible, setAttachmentVisible] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [productVisible, setProductVisible] = useState(false);
  const [productList, setProductList] = useState<ProductResponse[]>([]);
  const [requestVisible, setRequestVisible] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestList, setRequestList] = useState<BuyerRequest[]>([]);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(
    null,
  );
  const [myProfile, setMyProfile] = useState<ChatOtherUser | undefined>();
  /** Fullscreen image viewer for tapped chat images */
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  // How much the keyboard actually covers. Measured rather than inferred --
  // see useKeyboardOverlap for why the window's own resizing cannot be
  // trusted on Android.
  const keyboardOverlap = useKeyboardOverlap(!embedInSheet);
  const didInitialScrollRef = useRef(false);
  const pendingScrollToBottomRef = useRef(false);

  const myId = user?.user_id?.toString() ?? "";
  const PER_PAGE = 30;
  const hasValidRoomId = Number.isFinite(roomId) && roomId > 0;

  useEffect(() => {
    if (embedInSheet) return;
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [embedInSheet]);

  useEffect(() => {
    let cancelled = false;
    getUserProfile()
      .then((p) => {
        if (cancelled) return;
        setMyProfile({
          username: p.username,
          profile_picture: p.profile_picture,
          profile_picture_url: p.profile_picture_url,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const avatarCtx = React.useMemo(
    () => ({ myId, otherUser, myProfile }),
    [myId, otherUser, myProfile],
  );

  /** Display order: oldest first (chronological). API may return desc; we sort by created_at asc. */
  const sortedMessages = React.useMemo(() => {
    return [...messages]
      .map((m) => enrichChatMessage(m, avatarCtx))
      .sort(
        (a, b) =>
          (parseServerDate(a.created_at)?.getTime() ?? 0) -
          (parseServerDate(b.created_at)?.getTime() ?? 0),
      );
  }, [messages, avatarCtx]);

  const loadInitial = async () => {
    if (!hasValidRoomId) return;
    setLoading(true);
    try {
      const res = await getRoomMessages(roomId, 1, PER_PAGE);
      const list = res.messages ?? [];
      const reactionMap = await fetchReactionsForMessages(list);
      const enriched = attachReactionsToMessages(list, reactionMap);
      setMessages(enriched);
      enriched.forEach((m) => {
        const msgId = Number(m.id);
        if (!isNaN(msgId) && msgId > 0) chatSocket.joinMessage(msgId, myId);
      });
      setPage(2);
      const total = res.pagination?.total ?? 0;
      setHasMore(list.length < total);
      await markRoomRead(roomId);
    } catch {
      show({
        variant: "error",
        title: "Error",
        message: "Could not load messages.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOlder = async () => {
    if (loadingOlderRef.current || !hasMore || !roomId) return;
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const res = await getRoomMessages(roomId, page, PER_PAGE);
      const list = res.messages ?? [];
      if (list.length > 0) {
        const reactionMap = await fetchReactionsForMessages(list);
        const enriched = attachReactionsToMessages(list, reactionMap);
        enriched.forEach((m) => {
          const msgId = Number(m.id);
          if (!isNaN(msgId) && msgId > 0) chatSocket.joinMessage(msgId, myId);
        });
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueOlder = enriched.filter((m) => !existingIds.has(m.id));
          return [...uniqueOlder, ...prev];
        });
        setPage((p) => p + 1);
      }
      const total = res.pagination?.total ?? 0;
      setHasMore(list.length === PER_PAGE && page * PER_PAGE < total);
    } catch {
      show({
        variant: "error",
        title: "Error",
        message: "Could not load older messages.",
      });
    } finally {
      setLoadingOlder(false);
      loadingOlderRef.current = false;
    }
  };

  useEffect(() => {
    if (!hasValidRoomId) {
      setLoading(true);
      setMessages([]);
      return;
    }
    setMessages([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    loadInitial();
  }, [roomId, hasValidRoomId]);

  const scrollToBottom = useCallback((animated = false) => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated }));
  }, []);

  useEffect(() => {
    didInitialScrollRef.current = false;
    pendingScrollToBottomRef.current = false;
  }, [roomId]);

  useEffect(() => {
    if (loading || sortedMessages.length === 0 || didInitialScrollRef.current)
      return;
    didInitialScrollRef.current = true;
    pendingScrollToBottomRef.current = true;
    scrollToBottom(false);
    const retry = setTimeout(() => scrollToBottom(false), 200);
    return () => clearTimeout(retry);
  }, [loading, sortedMessages.length, scrollToBottom]);

  const handleContentSizeChange = useCallback(() => {
    if (pendingScrollToBottomRef.current) {
      pendingScrollToBottomRef.current = false;
      scrollToBottom(false);
    }
  }, [scrollToBottom]);

  const updateMessageReactions = useCallback(
    (
      messageId: number | string,
      updater: (
        reactions: import("../models/chat").MessageReactionSummary[],
      ) => import("../models/chat").MessageReactionSummary[],
    ) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (String(m.id) !== String(messageId)) return m;
          const rx = m.message_data?.reactions ?? [];
          return {
            ...m,
            message_data: { ...(m.message_data ?? {}), reactions: updater(rx) },
          };
        }),
      );
    },
    [],
  );

  const refreshMessageReactions = useCallback(
    async (messageId: number, targetId: number | string) => {
      try {
        const reactions = normalizeReactionSummaries(
          await getReactions(messageId),
        );
        setMessages((prev) =>
          prev.map((m) =>
            String(m.id) === String(targetId)
              ? { ...m, message_data: { ...(m.message_data ?? {}), reactions } }
              : m,
          ),
        );
      } catch {
        /* keep optimistic state */
      }
    },
    [],
  );

  const syncMessageReactions = useCallback(
    async (msg: ChatMessage) => {
      const msgId = Number(msg.id);
      if (isNaN(msgId) || msgId <= 0 || !myId) return;
      chatSocket.joinMessage(msgId, myId);
      await refreshMessageReactions(msgId, msg.id);
    },
    [myId, refreshMessageReactions],
  );

  useEffect(() => {
    if (!roomId || roomId <= 0) return;

    // connect() is async (it reads the auth token before opening the socket), so join
    // the room only once the socket exists — otherwise the emit is dropped, not buffered.
    let cancelled = false;
    (async () => {
      await chatSocket.connect();
      if (!cancelled) chatSocket.joinRoom(roomId, myId);
    })();

    const offMsg = chatSocket.onMessage(onSocketMessage);
    const offTyping = chatSocket.onTyping(onTypingUpdate);
    chatSocket.onStatus(() => {});

    const offReactionAdded = chatSocket.onReactionAdded((data) => {
      const isMine = data.user_id === myId || String(data.user_id) === myId;
      updateMessageReactions(data.message_id, (rx) =>
        applyReactionAdded(rx, data.reaction_type, isMine),
      );
    });
    const offReactionRemoved = chatSocket.onReactionRemoved((data) => {
      const isMine = data.user_id === myId || String(data.user_id) === myId;
      updateMessageReactions(data.message_id, (rx) =>
        applyReactionRemoved(rx, data.reaction_type, isMine),
      );
    });
    const offReactionStats = chatSocket.onReactionStats((data) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (String(m.id) !== String(data.message_id)) return m;
          return {
            ...m,
            message_data: {
              ...(m.message_data ?? {}),
              reactions: applyReactionStats(
                m.message_data?.reactions,
                data.reactions,
              ),
            },
          };
        }),
      );
    });

    return () => {
      cancelled = true;
      offMsg();
      offTyping();
      offReactionAdded();
      offReactionRemoved();
      offReactionStats();
      chatSocket.leaveRoom(roomId, myId);
    };
  }, [roomId, myId, updateMessageReactions]);

  function onSocketMessage(msg: ChatMessage) {
    if (msg.room_id !== roomId) return;
    setMessages((prev) => {
      if (
        prev.some(
          (m) =>
            m.id === msg.id ||
            (m.client_id && m.client_id === (msg as any).client_id),
        )
      ) {
        return prev.map((m) =>
          m.client_id &&
          (msg as any).client_id &&
          m.client_id === (msg as any).client_id
            ? { ...msg, pending: false, client_id: undefined }
            : m,
        );
      }
      return [...prev, msg];
    });
    void syncMessageReactions(msg);
    markRoomRead(roomId).catch(() => {});
    setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
  }

  const handleRespondToOffer = async (
    offerId: number,
    response: "accept" | "reject",
  ) => {
    try {
      await chatSocket.respondToOffer({
        offer_id: offerId,
        response,
        user_id: myId,
      });
      show({
        variant: "success",
        title: "Offer",
        message: response === "accept" ? "Offer accepted." : "Offer declined.",
      });
    } catch {
      show({
        variant: "error",
        title: "Error",
        message: "Could not respond to offer.",
      });
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
      show({
        variant: "error",
        title: "Error",
        message: "Could not send message.",
      });
    } finally {
      setSending(false);
    }
  }

  async function handlePickMedia(kind: "image" | "video") {
    if (sending) return;
    try {
      const perms = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perms.granted) {
        Alert.alert(
          "Permission required",
          "We need permission to access your photos.",
        );
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          kind === "image"
            ? ImagePicker.MediaTypeOptions.Images
            : ImagePicker.MediaTypeOptions.Videos,
        quality: 0.8,
      });
      if (res.canceled) return;

      setSending(true);
      const uri = res.assets?.[0]?.uri;
      const uploadResult = await attemptMultipleUpload(
        res.assets!.map((a) => ({ id: a?.assetId || "", uri: a?.uri || "" })),
      );
      for (const result of uploadResult) {
        const isImage = kind === "image";
        await (isImage ? chatSocket.sendImage : chatSocket.sendVideo)(
          roomId,
          myId,
          result.media?.original_url || result.urls?.["original"] || uri!,
          { localUri: uri },
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
      show({
        variant: "success",
        title: "Sent",
        message: kind === "image" ? "Photo sent." : "Video sent.",
      });
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
    } catch {
      show({
        variant: "error",
        title: "Error",
        message: "Could not send media.",
      });
    } finally {
      setSending(false);
    }
  }

  async function openProductPicker() {
    if (sending) return;
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
          show({
            variant: "error",
            title: "Error",
            message: "Could not load products.",
          });
        }
      } finally {
        setProductLoading(false);
      }
    }
  }

  function openAttachmentSheet() {
    if (sending) return;
    Keyboard.dismiss();
    setAttachmentVisible(true);
  }

  async function handleCamera() {
    if (sending) return;
    try {
      const perms = await ImagePicker.requestCameraPermissionsAsync();
      if (!perms.granted) {
        Alert.alert(
          "Permission required",
          "We need camera access to take photos.",
        );
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (res.canceled) return;

      setSending(true);
      const uri = res.assets?.[0]?.uri;
      const uploadResult = await attemptMultipleUpload(
        res.assets!.map((a) => ({ id: a?.assetId || "", uri: a?.uri || "" })),
      );
      for (const result of uploadResult) {
        await chatSocket.sendImage(
          roomId,
          myId,
          result.media?.original_url || result.urls?.["original"] || uri!,
          { localUri: uri },
        );
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
      show({ variant: "success", title: "Sent", message: "Photo sent." });
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
    } catch {
      show({
        variant: "error",
        title: "Error",
        message: "Could not send photo.",
      });
    } finally {
      setSending(false);
    }
  }

  async function openRequestPicker() {
    if (sending) return;
    setAttachmentVisible(false);
    Keyboard.dismiss();
    setRequestVisible(true);
    if (requestList.length === 0) {
      setRequestLoading(true);
      try {
        const all = await getBuyerRequests(1, 50);
        const mine = all.filter((r) => String(r.user?.id) === myId);
        setRequestList(mine);
      } catch {
        show({
          variant: "error",
          title: "Error",
          message: "Could not load your requests.",
        });
      } finally {
        setRequestLoading(false);
      }
    }
  }

  async function sendRequest(req: BuyerRequest) {
    if (sending) return;
    setSending(true);
    try {
      const title = req.title?.trim() || "Untitled request";
      const content = `Sharing request: ${title}`;
      const msg = await sendMessageREST(roomId, {
        content,
        message_type: "text",
        message_data: {
          request_id: req.id,
          request: {
            id: req.id,
            title: req.title,
            description: req.description,
            budget: req.budget,
          },
        },
      });
      setMessages((prev) => [...prev, msg]);
      setRequestVisible(false);
      show({
        variant: "success",
        title: "Sent",
        message: "Request shared in chat.",
      });
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
    } catch {
      show({
        variant: "error",
        title: "Error",
        message: "Could not share request.",
      });
    } finally {
      setSending(false);
    }
  }

  const [discountVisible, setDiscountVisible] = useState(false);
  const [offerDiscountVisible, setOfferDiscountVisible] = useState(false);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [discountLoading, setDiscountLoading] = useState(false);

  async function handleDiscounts() {
    if (sending) return;
    setDiscountVisible(true);
    setDiscountLoading(true);
    try {
      const list = await getRoomDiscounts(roomId);
      setDiscounts(Array.isArray(list) ? list : []);
    } catch {
      setDiscounts([]);
      show({
        variant: "error",
        title: "Error",
        message: "Could not load discounts.",
      });
    } finally {
      setDiscountLoading(false);
    }
  }

  async function handleCreateDiscount(offer: {
    discount_type: "percentage" | "fixed_amount";
    discount_value: number;
    expires_at: string;
    discount_message?: string;
  }) {
    await createRoomDiscount(roomId, offer);
    show({
      variant: "success",
      title: "Offer sent",
      message: "They can use it at checkout while it lasts.",
    });
    // Refresh the list so the seller sees what they just made if they look.
    try {
      const list = await getRoomDiscounts(roomId);
      setDiscounts(Array.isArray(list) ? list : []);
    } catch {
      // The offer is sent; a stale list is not worth an error.
    }
  }

  async function handleRespondToDiscount(
    discountId: number,
    response: "accepted" | "rejected",
  ) {
    try {
      await respondToDiscount(discountId, { response });
      setDiscounts((prev) =>
        (Array.isArray(prev) ? prev : []).filter((d) => d.id !== discountId),
      );
      show({
        variant: "success",
        title: "Discount",
        message:
          response === "accepted" ? "Discount accepted." : "Discount declined.",
      });
    } catch {
      show({
        variant: "error",
        title: "Error",
        message: "Could not respond to discount.",
      });
    }
  }

  async function sendProduct(productId: string) {
    if (sending) return;
    setSending(true);
    try {
      const msg = await sendProductMessage(roomId, productId, "Sharing product");
      setMessages((prev) => [...prev, { ...msg, pending: false }]);
      setProductVisible(false);
      show({
        variant: "success",
        title: "Sent",
        message: "Product shared in chat.",
      });
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
    } catch {
      show({
        variant: "error",
        title: "Error",
        message: "Could not share product.",
      });
    } finally {
      setSending(false);
    }
  }

  /** Get reaction summaries for display; fallback to legacy reactions_count/hasReactedClient for THUMBS_UP */
  function getReactionSummaries(
    m: ChatMessage,
  ): { reaction_type: string; count: number; has_reacted: boolean }[] {
    const rx = m.message_data?.reactions;
    if (Array.isArray(rx) && rx.length > 0)
      return rx.filter((r) => r.count > 0);
    const legacy = (m as any).hasReactedClient ?? false;
    const count = m.message_data?.reactions_count ?? 0;
    if (count > 0 || legacy)
      return [
        {
          reaction_type: "THUMBS_UP",
          count: count || (legacy ? 1 : 0),
          has_reacted: legacy,
        },
      ];
    return [];
  }

  async function handleAddReaction(
    message: ChatMessage,
    reactionType: ReactionType,
  ) {
    const msgId = Number(message.id);
    if (isNaN(msgId) || msgId <= 0) return;
    const rx = message.message_data?.reactions ?? [];
    const existing = rx.find((r) => r.reaction_type === reactionType);
    if (existing?.has_reacted) return;
    setReactionPickerFor(null);
    updateMessageReactions(message.id, (current) =>
      applyReactionAdded(current, reactionType, true),
    );
    try {
      await addReaction(msgId, reactionType);
      await refreshMessageReactions(msgId, message.id);
    } catch (err) {
      updateMessageReactions(message.id, (current) =>
        applyReactionRemoved(current, reactionType, true),
      );
      const status = (err as Error & { status?: number }).status;
      show({
        variant: "error",
        title: "Reaction",
        message:
          status === 400 ? "Invalid reaction." : "Could not add reaction.",
      });
    }
  }

  async function handleRemoveReaction(
    message: ChatMessage,
    reactionType: ReactionType,
  ) {
    const msgId = Number(message.id);
    if (isNaN(msgId) || msgId <= 0) return;
    setReactionPickerFor(null);
    updateMessageReactions(message.id, (current) =>
      applyReactionRemoved(current, reactionType, true),
    );
    try {
      await removeReaction(msgId, reactionType);
      await refreshMessageReactions(msgId, message.id);
    } catch {
      await refreshMessageReactions(msgId, message.id);
      show({
        variant: "error",
        title: "Error",
        message: "Could not remove reaction.",
      });
    }
  }

  function handlePickerReaction(
    message: ChatMessage,
    reactionType: ReactionType,
  ) {
    const existing = getReactionSummaries(message).find(
      (r) => r.reaction_type === reactionType,
    );
    if (existing?.has_reacted) handleRemoveReaction(message, reactionType);
    else handleAddReaction(message, reactionType);
  }

  function handleReactionTap(
    message: ChatMessage,
    r: { reaction_type: string; count: number; has_reacted: boolean },
  ) {
    if (r.has_reacted)
      handleRemoveReaction(message, r.reaction_type as ReactionType);
    else handleAddReaction(message, r.reaction_type as ReactionType);
  }

  async function handleAddProductToCart(productId?: string) {
    if (!productId) return;
    try {
      await addToCart({ product_id: productId, variant_id: 0, quantity: 1 });
      show({
        variant: "success",
        title: "Success",
        message: "Product added to cart.",
      });
    } catch {
      show({
        variant: "error",
        title: "Error",
        message: "Could not add to cart.",
      });
    }
  }

  function renderMessage({ item, index }: { item: ChatMessage; index: number }) {
    const isMe = item.sender_id === myId || String(item.sender_id) === myId;
    const avatar = getMessageAvatarProps(item, isMe, avatarCtx);

    // Runs of messages from one person in the same minute render as a single
    // block: the avatar sits beside the last bubble (so it lines up with where
    // the run ends, as Messenger and Instagram do) and only that bubble carries
    // a timestamp. Everything above it gets a spacer of the same width so the
    // bubbles stay on one edge.
    const prev = sortedMessages[index - 1];
    const next = sortedMessages[index + 1];
    const continuesPrev = isSameGroup(prev, item);
    const continuesNext = isSameGroup(item, next);
    const isGroupEnd = !continuesNext;
    // Reactions still need the gap above them even mid-run.
    const hasReactions = getReactionSummaries(item).length > 0;

    // Bubbles were `rounded` -- a 4px radius, so nearly square. A proper radius
    // with the adjoining corners tightened makes a run read as one connected
    // block, and the tail corner squares off at the end of the run.
    const bubbleShape = [
      "rounded-2xl",
      isMe
        ? `${continuesPrev ? "rounded-tr-md" : ""} ${continuesNext ? "rounded-br-md" : "rounded-br-sm"}`
        : `${continuesPrev ? "rounded-tl-md" : ""} ${continuesNext ? "rounded-bl-md" : "rounded-bl-sm"}`,
    ].join(" ");

    return (
      <View
        className={`flex-row px-3 ${continuesPrev ? "pt-0.5" : "pt-2.5"} ${
          isGroupEnd ? "pb-0.5" : "pb-0"
        } ${isMe ? "justify-end" : "justify-start"}`}
      >
        {!isMe &&
          (isGroupEnd ? (
            <View className="mr-2">
              <Avatar
                key={`peer-${item.id}-${avatar.uri ?? "init"}`}
                uri={avatar.uri}
                name={avatar.name}
                size={30}
              />
            </View>
          ) : (
            // Keeps the bubbles in a run flush with the one that has the avatar.
            <View className="mr-2" style={{ width: 30 }} />
          ))}
        <View className={`max-w-[86%] ${isMe ? "items-end" : "items-start"}`}>
          {item.message_type === "text" &&
            (() => {
              const sharedRequest = item.message_data?.request as
                | { title?: string; description?: string; budget?: number }
                | undefined;
              const requestId = item.message_data?.request_id as
                | string
                | undefined;
              if (
                requestId &&
                (item.content?.includes("Sharing request") || sharedRequest)
              ) {
                return (
                  <View
                    className={`px-4 py-3 min-w-[200px] ${bubbleShape} ${isMe ? "bg-primary-fill" : "bg-surface-raised border border-border"}`}
                  >
                    <Text
                      className={`text-xs font-medium uppercase tracking-wide ${isMe ? "text-white/80" : "text-text-secondary"}`}
                    >
                      Buyer request
                    </Text>
                    <Text
                      className={`text-base font-semibold mt-1 ${isMe ? "text-white" : "text-text-primary"}`}
                      numberOfLines={2}
                    >
                      {sharedRequest?.title ||
                        item.content.replace(/^Sharing request:\s*/i, "")}
                    </Text>
                    {sharedRequest?.description ? (
                      <Text
                        className={`text-sm mt-1 ${isMe ? "text-white/90" : "text-text-secondary"}`}
                        numberOfLines={3}
                      >
                        {sharedRequest.description}
                      </Text>
                    ) : null}
                    {sharedRequest?.budget != null && (
                      <Text
                        className={`text-sm font-semibold mt-2 ${isMe ? "text-white" : "text-text-primary"}`}
                      >
                        Budget: ₦{Number(sharedRequest.budget).toLocaleString()}
                      </Text>
                    )}
                  </View>
                );
              }
              const productIdInContent = (item.content || "").match(
                /PRD_[\w]+/,
              )?.[0];
              if (
                productIdInContent &&
                (item.content?.includes("Sharing product") ||
                  /^PRD_[\w]+$/.test(item.content.trim()))
              ) {
                return (
                  <ChatProductDisplayComponent
                    productId={productIdInContent}
                    embeddedProduct={null}
                    showAddToCart={role === "buyer"}
                    onAddToCart={handleAddProductToCart}
                  />
                );
              }
              return (
                <View
                  className={`px-4 py-2.5 ${bubbleShape} ${isMe ? "bg-primary-fill" : "bg-surface-raised border border-border"}`}
                >
                  <Text
                    className={`text-base ${isMe ? "text-white" : "text-text-primary"}`}
                  >
                    {item.content}
                  </Text>
                </View>
              );
            })()}

          {item.message_type === "image" &&
            (() => {
              const imageUri = normalizeUri(
                item.message_data?.url ??
                  item.message_data?.image_url ??
                  item.content,
              );
              if (!imageUri) {
                return (
                  <View
                    className="w-56 h-40 rounded items-center justify-center px-3 bg-media"
                  >
                    <Text
                      className="text-sm text-center text-text-secondary"
                    >
                      Image unavailable
                    </Text>
                  </View>
                );
              }
              return (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setViewerUri(imageUri)}
                >
                  <Image
                    source={{ uri: imageUri }}
                    className="w-56 h-40 rounded bg-media"
                    resizeMode="cover"
                  />
                  {item.pending && (
                    <Text className="text-text-muted text-xs mt-1">Sending…</Text>
                  )}
                </TouchableOpacity>
              );
            })()}

          {item.message_type === "video" &&
            (() => {
              const videoUri = normalizeUri(
                item.message_data?.url ??
                  (item.message_data as any)?.video_url ??
                  item.content,
              );
              if (!videoUri) {
                return (
                  <View
                    className="w-56 h-40 rounded items-center justify-center px-3 bg-media"
                  >
                    <Text
                      className="text-sm text-center text-text-secondary"
                    >
                      Video unavailable
                    </Text>
                  </View>
                );
              }
              return (
                <View>
                  <View
                    className="w-56 h-40 rounded overflow-hidden bg-media"
                  >
                    <InlineVideo
                      uri={videoUri}
                      style={{ width: "100%", height: "100%" }}
                      controls
                    />
                  </View>
                  {item.pending && (
                    <Text className="text-text-muted text-xs mt-1">Sending…</Text>
                  )}
                </View>
              );
            })()}

          {item.message_type === "product" &&
            (() => {
              const productId = item.message_data?.product_id
                ? String(item.message_data.product_id)
                : (item.content || "").match(/PRD_[\w]+/)?.[0];
              const embeddedProduct = item.message_data?.product;
              const caption = productMessageCaption(item.content, productId);
              if (!productId && !embeddedProduct?.id) {
                return (
                  <View
                    className="rounded border px-4 py-3 bg-surface-sunken border-border"
                  >
                    <Text
                      className="text-sm text-text-secondary"
                    >
                      Product no longer available
                    </Text>
                  </View>
                );
              }
              return (
                <View className="gap-2">
                  {caption ? (
                    <View
                      className={`px-4 py-2.5 ${bubbleShape} ${isMe ? "bg-primary-fill" : "bg-surface-raised border border-border"}`}
                    >
                      <Text
                        className={`text-base ${isMe ? "text-white" : "text-text-primary"}`}
                      >
                        {caption}
                      </Text>
                    </View>
                  ) : null}
                  <ChatProductDisplayComponent
                    productId={productId}
                    embeddedProduct={embeddedProduct}
                    showAddToCart={role === "buyer"}
                    onAddToCart={handleAddProductToCart}
                  />
                </View>
              );
            })()}

          {item.message_type === "offer" && (
            <View
              className="rounded overflow-hidden border min-w-[200px] bg-surface-raised border-border"
            >
              <View
                className="px-4 py-3 bg-media"
              >
                <Text
                  className="text-xs font-medium uppercase tracking-wide text-text-secondary"
                >
                  Price offer
                </Text>
                <Text
                  className="text-lg font-bold mt-0.5 text-text-primary"
                >
                  ₦
                  {Number(
                    (item as any).offer?.price ??
                      (item as any).offer?.offer_amount ??
                      item.content ??
                      0,
                  ).toLocaleString()}
                </Text>
                {(item as any).offer?.message && (
                  <Text
                    className="text-sm mt-1 text-text-secondary"
                    numberOfLines={2}
                  >
                    {(item as any).offer.message}
                  </Text>
                )}
              </View>
              {role === "buyer" &&
                (item as any).offer?.status === "pending" &&
                (item as any).offer?.id && (
                  <View className="flex-row p-2 gap-2">
                    <TouchableOpacity
                      onPress={() =>
                        handleRespondToOffer(
                          Number((item as any).offer.id),
                          "accept",
                        )
                      }
                      className="flex-1 py-2.5 rounded bg-primary-fill items-center"
                    >
                      <Text className="text-white font-semibold text-sm">
                        Accept
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        handleRespondToOffer(
                          Number((item as any).offer.id),
                          "reject",
                        )
                      }
                      className="flex-1 py-2.5 rounded border items-center bg-surface-sunken border-border"
                    >
                      <Text
                        className="font-semibold text-sm text-text-primary"
                      >
                        Decline
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              {(item as any).offer?.status &&
                (item as any).offer?.status !== "pending" && (
                  <View className="px-4 py-2">
                    <Text
                      className="text-xs capitalize text-text-secondary"
                    >
                      {(item as any).offer.status}
                    </Text>
                  </View>
                )}
            </View>
          )}

          <View
            className={`flex-row items-center gap-2 flex-wrap ${
              isGroupEnd || hasReactions ? "mt-1" : ""
            }`}
          >
            {/* One timestamp per run, not one per message. A burst of five
                messages used to stack five identical times down the screen. */}
            {isGroupEnd ? (
              <Text className="text-text-muted text-[11px]">
                {formatTime(item.created_at)}
              </Text>
            ) : null}
            {!isNaN(Number(item.id)) && Number(item.id) > 0 && (
              <>
                {getReactionSummaries(item).map((r) => (
                  <TouchableOpacity
                    key={r.reaction_type}
                    onPress={() => handleReactionTap(item, r)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className={`flex-row items-center gap-0.5 px-1.5 py-0.5 rounded border ${
                      r.has_reacted
                        ? isDark
                          ? "bg-dark-elevated border-dark-border-strong"
                          : "bg-surface-sunken border-border"
                        : isDark
                          ? "bg-dark-surface border-transparent"
                          : "bg-white border-transparent"
                    }`}
                  >
                    {(() => {
                      const ReactionIcon = getReactionIcon(r.reaction_type);
                      return (
                        <ReactionIcon
                          size={12}
                          color={r.has_reacted ? textColor : mutedColor}
                        />
                      );
                    })()}
                    {(r.count > 1 || r.has_reacted) && (
                      <Text
                        className={`text-[11px] ${r.has_reacted ? `text-text-primary font-semibold` : "text-text-secondary"}`}
                      >
                        {r.count}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() =>
                    setReactionPickerFor(
                      reactionPickerFor === String(item.id)
                        ? null
                        : String(item.id),
                    )
                  }
                  onLongPress={() => setReactionPickerFor(String(item.id))}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="p-1"
                >
                  <SmilePlus size={14} color={mutedColor} />
                </TouchableOpacity>
                {reactionPickerFor === String(item.id) && (
                  <View className="flex-row gap-1 mt-0.5">
                    {COMMON_REACTIONS.map((type) => {
                      const active = getReactionSummaries(item).some(
                        (r) => r.reaction_type === type && r.has_reacted,
                      );
                      return (
                        <TouchableOpacity
                          key={type}
                          onPress={() => handlePickerReaction(item, type)}
                          className={`px-2 py-1 rounded border ${active ? ("bg-surface-sunken border-border") : "bg-surface-raised border-border"}`}
                        >
                          {(() => {
                            const PickerIcon = getReactionIcon(type);
                            return (
                              <PickerIcon
                                size={16}
                                color={active ? textColor : mutedColor}
                              />
                            );
                          })()}
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity
                      onPress={() => setReactionPickerFor(null)}
                      className="px-2 py-1 rounded bg-media"
                    >
                      <X size={14} color={mutedColor} />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
          {item.pending && (
            <Text className="text-text-muted text-[10px] mt-0.5">Pending…</Text>
          )}
        </View>
        {/* No avatar on your own messages. This is a 1:1 thread -- alignment
            and colour already say who sent it -- and the avatar cost 40px of
            width on every outgoing line. Neither WhatsApp nor Instagram shows
            one here. */}
      </View>
    );
  }

  // Plain FlatList and TextInput in both modes now.
  //
  // The sheet variant used BottomSheetFlatList and BottomSheetTextInput,
  // which call useBottomSheetInternal and therefore require a @gorhom
  // BottomSheet ancestor. The quick chat stopped being one -- it is a
  // full-screen Modal, because a 90% sheet could not get its input clear of
  // the keyboard -- so those components threw "'useBottomSheetInternal'
  // cannot be used out of the BottomSheet!" the moment the list rendered.
  //
  // Nothing else renders this in a BottomSheet, so there is no mode left that
  // needs them. `embedInSheet` still means what it always meant: no header of
  // its own, and the input bar handed to the parent.
  const ListComponent = FlatList;
  const InputComponent = TextInput;
  // Sheet mode: the footer sits flush with the screen bottom (bottomInset=0 in
  // QuickChatBottomSheet), so the safe-area gap is padded inside the bar itself.
  const inputBottomPad = embedInSheet || !keyboardVisible
    ? Math.max(insets.bottom, 8)
    : 8;
  // Android only, and only as a full screen. KeyboardAvoidingView's "height"
  // behaviour relies on the window shrinking when the IME opens, and under
  // edge-to-edge it does not -- so the bar stayed where it was and the
  // keyboard sat on top of it. iOS is unaffected: "padding" works there, and
  // doubling up would lift the bar twice.
  const androidKeyboardLift =
    Platform.OS === "android" && !embedInSheet ? keyboardOverlap : 0;
  // Sheet mode: the BottomSheetFooter overlays the list, so the list needs
  // bottom padding equal to the measured footer height to keep the newest
  // message visible just above the input bar.
  const [sheetFooterHeight, setSheetFooterHeight] = useState(64);

  const messageList = loading ? (
    <View style={[styles.sheetListWrap, styles.sheetLoading]}>
      <ActivityIndicator size="large" color={textColor} />
    </View>
  ) : (
    <ListComponent
      ref={listRef as never}
      style={embedInSheet ? styles.sheetList : undefined}
      data={sortedMessages}
      keyExtractor={(it) => String(it.id)}
      renderItem={renderMessage}
      onContentSizeChange={handleContentSizeChange}
      contentContainerStyle={
        sortedMessages.length === 0
          ? [
              styles.emptyListContent,
              embedInSheet && { paddingBottom: sheetFooterHeight },
            ]
          : {
              paddingTop: 12,
              paddingBottom: embedInSheet ? sheetFooterHeight + 12 : 8,
            }
      }
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      onScroll={({ nativeEvent }) => {
        const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
        const padding = 80;
        if (contentOffset.y < padding && hasMore && !loadingOlder) loadOlder();
      }}
      scrollEventThrottle={400}
      ListHeaderComponent={
        hasMore && loadingOlder ? (
          <View className="py-3 items-center">
            <ActivityIndicator size="small" color={textColor} />
          </View>
        ) : null
      }
      ListEmptyComponent={
        !loading && sortedMessages.length === 0 ? (
        <View className="items-center justify-center px-6 py-10">
          <Text
            className="text-base font-semibold text-center text-text-primary"
          >
            Start a conversation…
          </Text>
          <Text
            className="text-sm mt-2 text-center text-text-secondary"
          >
            Say hello or ask a question about this product.
          </Text>
        </View>
        ) : null
      }
    />
  );

  const typingIndicator = typingUser ? (
    <View className="px-4 py-2 flex-row items-center">
      <View
        className="flex-row gap-1 px-3 py-2 rounded border self-start bg-surface-sunken border-border"
      >
        <View className="w-2 h-2 rounded bg-text-secondary opacity-60" />
        <View className="w-2 h-2 rounded bg-text-secondary opacity-80" />
        <View className="w-2 h-2 rounded bg-text-secondary" />
      </View>
      <Text
        className="text-sm ml-2 text-text-secondary"
      >
        {typingUser} is typing
      </Text>
    </View>
  ) : null;

  const inputBar = (
    <View
      className="flex-row items-center px-4 py-2 border-t gap-2 min-h-[52px] bg-surface-raised border-border"
      style={{ paddingBottom: inputBottomPad }}
    >
      <View
        className="flex-1 flex-row items-center rounded-3xl pl-4 pr-1 py-1.5 bg-media"
      >
        <InputComponent
          value={input}
          onChangeText={(t) => {
            setInput(t);
            chatSocket.typingStart(roomId, myId);
          }}
          placeholder="Type a message…"
          placeholderTextColor={mutedColor}
          className="flex-1 text-base min-h-[24px] max-h-[80px] text-text-primary"
          multiline
          maxLength={1000}
          textAlignVertical="center"
        />
        <TouchableOpacity
          onPress={openAttachmentSheet}
          disabled={sending}
          className={`p-2 ${sending ? "opacity-50" : ""}`}
        >
          <Plus size={22} color={mutedColor} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={handleSendText}
        disabled={sending}
        className="w-11 h-11 rounded-full bg-primary-fill items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel="Send message"
      >
        <Send size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  const overlays = (
    <>
      <MediaViewerModal
        visible={viewerUri !== null}
        items={viewerUri ? [{ uri: viewerUri, type: "image" }] : []}
        onClose={() => setViewerUri(null)}
      />
      <ChatAttachmentSheet
        visible={attachmentVisible}
        busy={sending}
        onClose={() => setAttachmentVisible(false)}
        onCamera={handleCamera}
        onPhotos={() => handlePickMedia("image")}
        onProducts={role === "seller" ? openProductPicker : undefined}
        onRequests={role === "buyer" ? openRequestPicker : undefined}
        onDiscounts={handleDiscounts}
        onCreateDiscount={
          role === "seller" ? () => setOfferDiscountVisible(true) : undefined
        }
        role={role === "buyer" || role === "seller" ? role : "buyer"}
      />
      <DiscountOfferSheet
        visible={offerDiscountVisible}
        onClose={() => setOfferDiscountVisible(false)}
        onSubmit={handleCreateDiscount}
      />
      {discountVisible && (
        <View className="absolute inset-0 z-[1000] bg-black/40 justify-end">
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setDiscountVisible(false)}
            activeOpacity={1}
          />
          <View
            className="rounded-t max-h-[50%] px-4 pt-4 pb-10 bg-surface-raised"
          >
            <View className="flex-row justify-between mb-4">
              <Text
                className="font-semibold text-base text-text-primary"
              >
                Active discounts
              </Text>
              <TouchableOpacity onPress={() => setDiscountVisible(false)}>
                <Text
                  className="font-semibold text-text-primary"
                >
                  Done
                </Text>
              </TouchableOpacity>
            </View>
            {discountLoading ? (
              <ActivityIndicator size="small" color={textColor} />
            ) : (Array.isArray(discounts) ? discounts : []).length === 0 ? (
              <Text
                className="text-sm text-text-secondary"
              >
                No active discounts for this chat.
              </Text>
            ) : (
              (Array.isArray(discounts) ? discounts : []).map((d) => (
                <View
                  key={d.id}
                  className="rounded p-3 mb-2 bg-media"
                >
                  <Text
                    className="font-medium text-sm text-text-primary"
                  >
                    {d.discount_message ?? d.discount_type ?? "Discount"}
                  </Text>
                  <Text
                    className="font-semibold text-sm mt-1 text-text-primary"
                  >
                    ₦{Number(d.discount_value ?? 0).toLocaleString()}
                  </Text>
                  {role === "buyer" &&
                    (d.status === "pending" || !d.status) && (
                      <View className="flex-row gap-2 mt-2">
                        <TouchableOpacity
                          onPress={() =>
                            handleRespondToDiscount(d.id, "accepted")
                          }
                          className="flex-1 py-2 rounded bg-primary-fill items-center"
                        >
                          <Text className="text-white font-semibold text-sm">
                            Accept
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            handleRespondToDiscount(d.id, "rejected")
                          }
                          className="flex-1 py-2 rounded border items-center bg-surface-sunken border-border"
                        >
                          <Text
                            className="font-semibold text-sm text-text-primary"
                          >
                            Decline
                          </Text>
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
        disabled={sending}
        selectedProducts={[]}
        onClose={() => setProductVisible(false)}
        onSelect={(product) => sendProduct(product.id)}
      />
      <RequestPicker
        visible={requestVisible}
        requests={requestList}
        loading={requestLoading}
        disabled={sending}
        onClose={() => setRequestVisible(false)}
        onSelect={sendRequest}
      />
    </>
  );

  useLayoutEffect(() => {
    if (!embedInSheet || !onSheetFooterReady) return;
    if (loading) {
      onSheetFooterReady(null);
      return;
    }
    onSheetFooterReady(
      <View
        onLayout={(e) => setSheetFooterHeight(e.nativeEvent.layout.height)}
      >
        {typingIndicator}
        {inputBar}
      </View>,
    );
    return () => onSheetFooterReady(null);
  }, [
    embedInSheet,
    onSheetFooterReady,
    loading,
    typingUser,
    input,
    sending,
    attachmentVisible,
    isDark,
    mutedColor,
    textColor,
    inputBottomPad,
  ]);

  if (embedInSheet) {
    return (
      <View style={styles.sheetBody}>
        <View style={styles.sheetListWrap}>{messageList}</View>
        {overlays}
      </View>
    );
  }

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-surface-page"
      >
        <ActivityIndicator size="large" color={textColor} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface-page"
      // Android gets no behaviour at all -- the measured lift below does the
      // work, and "height" actively fought it by resizing a window that
      // edge-to-edge had already stopped resizing.
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View
        className="flex-row items-center px-4 py-3 border-b bg-surface-raised border-border"
      >
        <TouchableOpacity
          onPress={() => (onClose ? onClose() : router.back())}
          className="mr-3 p-1"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={24} color={textColor} />
        </TouchableOpacity>
        <Avatar
          uri={pickProfilePicture(otherUser)}
          name={otherUser?.username}
          size={40}
        />
        <Text
          className="ml-3 font-semibold text-base flex-1 text-text-primary"
          numberOfLines={1}
        >
          {otherUser?.username ?? "Chat"}
        </Text>
      </View>

      {messageList}
      {typingIndicator}
      <View style={{ paddingBottom: androidKeyboardLift }}>{inputBar}</View>
      {overlays}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  sheetBody: {
    flex: 1,
    minHeight: 0,
  },
  sheetListWrap: {
    flex: 1,
    minHeight: 0,
  },
  sheetList: {
    flex: 1,
  },
  sheetLoading: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 12,
  },
});
