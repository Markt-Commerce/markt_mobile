// /screens/ChatScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { ArrowLeft, Phone, Image as ImageIcon, Camera, Send as SendIcon, ThumbsUp } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import chatSocket from "../services/chatSock";
import { getRoomMessages, markRoomRead, sendMessageREST, sendProductMessageMock, addReaction, removeReaction } from "../services/sections/chat";
import { ChatMessage } from "../models/chat";
import { addToCart } from "../services/sections/cart";

export type ChatProps = {
  route: { params: { roomId: number; otherUser?: { username?: string; profile_picture?: string, user_id: string } } };
  navigation: any;
};

export default function ChatScreen({ route, navigation }: ChatProps) {
  const { roomId, otherUser } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const listRef = useRef<FlatList<ChatMessage>>(null);


  // load messages (first page)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getRoomMessages(roomId, 1, 50);
        if (!mounted) return;
        setMessages(res.messages ?? []);
        setPage(2);
        // mark read
        await markRoomRead(roomId);
      } catch (e) {
        console.error("Failed loading messages", e);
        Alert.alert("Error", "Could not load messages.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [roomId]);

  // socket connection & listeners
  useEffect(() => {
    chatSocket.connect();

    const offMsg = chatSocket.onMessage(onSocketMessage);
    const offTyping = chatSocket.onTyping(onTypingUpdate);
    const offStatus = chatSocket.onStatus((s) => {
      // optionally show connection status
      // console.log("socket status", s);
    });

    // join room
    chatSocket.joinRoom(roomId);

    return () => {
      offMsg();
      offTyping();
      offStatus();
      chatSocket.leaveRoom(roomId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  function onSocketMessage(msg: ChatMessage) {
    // only messages for this room
    if (msg.room_id !== roomId) return;
    setMessages((prev) => {
      // if already present (same id), skip
      if (prev.some(m => m.id === msg.id || m.client_id && m.client_id === msg.client_id)) {
        // merge ack/pending removal
        return prev.map(m => {
          if (m.client_id && msg.client_id && m.client_id === msg.client_id) {
            return { ...msg, pending: false, client_id: undefined };
          }
          return m;
        });
      }
      return [...prev, msg];
    });
    // mark read immediately
    markRoomRead(roomId).catch(_ => {});
    // scroll to bottom
    setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
  }

  function onTypingUpdate(update: any) {
    if (update.room_id !== roomId) return;
    if (update.action === "start") setTypingUser(update.username ?? "Someone");
    else setTypingUser(null);
    // clear typing indicator after a short time
    if (update.action === "start") {
      setTimeout(() => setTypingUser(null), 2500);
    }
  }

  // send text message
  async function handleSendText() {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    try {
      // try socket send first (chatSocket queues if offline)
      const client_id = await chatSocket.sendText(roomId, content);
      // add optimistic message to UI
      const temp: ChatMessage = {
        id: `c_${client_id}`,
        client_id,
        room_id: roomId,
        sender_id: "ME",
        content,
        message_type: "text",
        message_data: null,
        is_read: false,
        created_at: new Date().toISOString(),
        pending: true,
      };
      setMessages(prev => [...prev, temp]);
      // scroll
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
    } catch (e) {
      console.error("send text error", e);
      Alert.alert("Send failed", "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  // pick image or video
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
      // res.uri | res.type? For expo, res.type is 'image' or 'video' (legacy). Use res.uri and determine mime
      const uri = res.assets?.[0]?.uri;
      const mime = kind === "image" ? "image/jpeg" : "video/mp4";
      // NOTE: upload flow - upload to your media server or S3, then send URL to chat
      const uploadedUrl = await uploadMediaMock(uri); // replace with real upload
      // send via socket
      const client_id = kind === "image"
        ? await chatSocket.sendImage(roomId, uploadedUrl, mime, { localUri: uri })
        : await chatSocket.sendVideo(roomId, uploadedUrl, mime, { localUri: uri });

      const temp: ChatMessage = {
        id: `c_${client_id}`,
        client_id,
        room_id: roomId,
        sender_id: "ME",
        content: uploadedUrl,
        message_type: kind === "image" ? "image" : "video",
        message_data: { url: uploadedUrl },
        is_read: false,
        created_at: new Date().toISOString(),
        pending: true,
      };
      setMessages(prev => [...prev, temp]);
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
    } catch (e) {
      console.error("pick media error", e);
      Alert.alert("Error", "Could not pick media.");
    }
  }

  // send product (mock)
  async function handleSendProduct(product_id: string) {
    try {
      setSending(true);
      // optimistic ui
      const mock = await sendProductMessageMock(roomId, product_id, `Product shared: ${product_id}`);
      setMessages(prev => [...prev, { ...mock, pending: false }]);
      // optionally also inform server via socket (chatSocket.sendProduct) — better if supported
      await chatSocket.sendProduct(roomId, product_id, `Sharing product ${product_id}`);
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
    } catch (e) {
      console.error("send product", e);
      Alert.alert("Error", "Could not send product.");
    } finally {
      setSending(false);
    }
  }

  // simple image upload mock - replace with your media API
  async function uploadMediaMock(localUri: string): Promise<string> {
    // In real: upload to S3 or media endpoint and return URL
    // For now: return the localUri (works in development) or a placeholder URL
    return localUri;
  }

  // Reaction toggle (thumbs up)
  async function toggleReaction(message: ChatMessage) {
    try {
      // For this demo, we check message.message_data?.reacted_by_me boolean (not provided by backend model).
      const alreadyReacted = !!(message as any).hasReactedClient;
      if (!alreadyReacted) {
        await addReaction(Number(message.id), "THUMBS_UP");
        // update local UI
        setMessages(prev => prev.map(m => (m.id === message.id ? { ...m, message_data: { ...m.message_data, reactions_count: (m.message_data?.reactions_count ?? 0) + 1 }, hasReactedClient: true } : m)));
      } else {
        await removeReaction(Number(message.id), "THUMBS_UP");
        setMessages(prev => prev.map(m => (m.id === message.id ? { ...m, message_data: { ...m.message_data, reactions_count: Math.max(0, (m.message_data?.reactions_count ?? 1) - 1) }, hasReactedClient: false } : m)));
      }
    } catch (e) {
      console.error("reaction fail", e);
    }
  }

  // render items
  function renderMessage({ item }: { item: ChatMessage }) {
    const isMe = (item.sender_id === "ME" || item.sender_id === "me");
    const time = new Date(item.created_at).toLocaleTimeString();
    return (
      <View style={{ padding: 8, flexDirection: "row", justifyContent: isMe ? "flex-end" : "flex-start" }}>
        {!isMe && (
          <Image source={{ uri: item.message_data?.avatar ?? otherUser?.profile_picture ?? undefined }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 8, backgroundColor: "#ddd" } as any} />
        )}
        <View style={{ maxWidth: "78%", alignItems: isMe ? "flex-end" : "flex-start" }}>
          {item.message_type === "text" && (
            <View style={{
              backgroundColor: isMe ? "#ea2832" : "#f3e7e8",
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
            }}>
              <Text style={{ color: isMe ? "#fff" : "#1b0e0e" }}>{item.content}</Text>
            </View>
          )}

          {item.message_type === "image" && (
            <TouchableOpacity onPress={() => {/* image preview */}}>
              <Image source={{ uri: item.content }} style={{ width: 220, height: 140, borderRadius: 10, backgroundColor: "#eee" } as any} />
              {item.pending && <Text style={{ fontSize: 12, color: "#999" }}>Sending...</Text>}
            </TouchableOpacity>
          )}

          {item.message_type === "video" && (
            <View style={{ width: 220, height: 140, borderRadius: 10, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
              <Text style={{ color: "#fff" }}>Video</Text>
            </View>
          )}

          {item.message_type === "product" && (
            <View style={{ borderRadius: 10, padding: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee" }}>
              <Text style={{ fontWeight: "700" }}>{item.message_data?.product_name ?? `Product ${item.message_data?.product_id ?? ""}`}</Text>
              <Text style={{ color: "#666" }}>{item.message_data?.product_price ? `$${item.message_data.product_price}` : ""}</Text>
              <TouchableOpacity onPress={() => handleAddProductToCart(item.message_data?.product_id)} style={{ marginTop: 8, padding: 8, backgroundColor: "#e26136", borderRadius: 8 }}>
                <Text style={{ color: "#fff", textAlign: "center" }}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
            <Text style={{ color: "#8b8b8b", fontSize: 11, marginRight: 8 }}>{time}</Text>
            <TouchableOpacity onPress={() => toggleReaction(item)} style={{ padding: 4 }}>
              <ThumbsUp size={16} color={(item as any).hasReactedClient ? "#2b8a3e" : "#60758a"} />
            </TouchableOpacity>
          </View>

          {item.pending && <Text style={{ fontSize: 11, color: "#999", marginTop: 4 }}>Pending…</Text>}
        </View>

        {isMe && (
          <Image source={{ uri: "https://placehold.co/80x80" }} style={{ width: 36, height: 36, borderRadius: 18, marginLeft: 8, backgroundColor: "#ddd" } as any} />
        )}
      </View>
    );
  }

  async function handleAddProductToCart(productId?: string) {
    if (!productId) return Alert.alert("Missing product id");
    // implement addToCart using your cart service
    try {
      await addToCart({ product_id: productId, variant_id: 0, quantity: 1 });
      Alert.alert("Added to cart", `Product ${productId} added to cart (mock).`);
    } catch (e) {
      Alert.alert("Error", "Could not add to cart.");
    }
  }

  // load older messages on scroll up
  async function loadMore() {
    try {
      const res = await getRoomMessages(roomId, page, 50);
      if (res.messages && res.messages.length) {
        setMessages(prev => [...res.messages, ...prev]);
        setPage(p => p + 1);
      }
    } catch (e) {
      console.error("load more error", e);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#e26136" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#fcf8f8" }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(it) => String(it.id)}
        renderItem={renderMessage}
        onEndReachedThreshold={0.2}
        onEndReached={loadMore}
        contentContainerStyle={{ paddingVertical: 8 }}
      />

      {typingUser && <Text style={{ paddingHorizontal: 16, color: "#60758a" }}>{typingUser} is typing...</Text>}

      <View style={{ padding: 12, flexDirection: "row", gap: 8, alignItems: "center" }}>
        <View style={{ flexDirection: "row", backgroundColor: "#f3e7e8", flex: 1, borderRadius: 28, paddingHorizontal: 12, alignItems: "center" }}>
          <TextInput
            value={input}
            onChangeText={(t) => {
              setInput(t);
              chatSocket.typingStart(roomId);
            }}
            placeholder="Message..."
            placeholderTextColor="#994d51"
            style={{ flex: 1, paddingVertical: 10, color: "#1b0e0e" }}
            multiline
          />

          <TouchableOpacity onPress={() => handlePickMedia("image")} style={{ padding: 8 }}>
            <ImageIcon color="#994d51" size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handlePickMedia("video")} style={{ padding: 8 }}>
            <Camera color="#994d51" size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { /* open product picker */ handleSendProduct("PRD_001"); }} style={{ padding: 8 }}>
            <Text style={{ color: "#994d51", fontWeight: "600" }}>Product</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleSendText} disabled={sending} style={{ backgroundColor: "#ea2832", borderRadius: 24, height: 44, width: 44, alignItems: "center", justifyContent: "center" }}>
          <SendIcon size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
