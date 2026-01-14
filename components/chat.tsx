// /screens/ChatScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { ArrowLeft, Phone, Image as ImageIcon, Camera, Send as SendIcon, ThumbsUp, ShoppingBag } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import chatSocket from "../services/chatSock";
import { getRoomMessages, markRoomRead, sendMessageREST, sendProductMessageMock, addReaction, removeReaction } from "../services/sections/chat";
import { ChatMessage } from "../models/chat";
import { addToCart } from "../services/sections/cart";
import { useUser } from "../hooks/userContextProvider";
import { useRouter } from "expo-router";
import { useToast } from "./ToastProvider";
import ProductPicker from "./productPicker";
import BottomSheet from "@gorhom/bottom-sheet";
import { PlaceholderProduct, Product } from "../models/products";
import { getProductById, getSellerProducts } from "../services/sections/product";
import { uploadImage, attemptMultipleUpload } from "../services/sections/media";
import ChatProductDisplayComponent from "./chatProductDisplayComponent";


export type ChatProps = {
  route: { params: { roomId: number; otherUser?: { username?: string; profile_picture?: string, user_id: string } } };
  navigation: any;
};

export default function ChatScreen({ route, navigation }: ChatProps) {
  const {user, role} = useUser();
  const { roomId, otherUser } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const router = useRouter();
  const { show } = useToast();

  //Will change product picker to use refs later
  const productPickerRef = useRef<BottomSheet>(null)
  const [productVisible, setProductVisible] = useState<boolean>(false)
  const [productList, setProductList] = useState<PlaceholderProduct[]>([])
  const [currentProductIds, setCurrentProductIds] = useState<string[]>([]);


  // load messages (first page)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (!roomId || roomId === 0) return;
        // fetch messages
        const res = await getRoomMessages(roomId, 1, 50);
        setMessages(res.messages ?? []);
        setPage(2);
        // mark read
        await markRoomRead(roomId);
      } catch (e) {
        show({
          message: "Could not load messages.",
          variant: "error",
          title: "Error"
        })
      } finally {
        setLoading(false);
      }
    })();
  }, [roomId]);

  // socket connection & listeners
  useEffect(() => {
    chatSocket.connect();

    const offMsg = chatSocket.onMessage(onSocketMessage);
    const offTyping = chatSocket.onTyping(onTypingUpdate);
    const offStatus = chatSocket.onStatus((s) => {
      // optionally show connection status
      console.log("socket status", s);
    });

    // join room
    chatSocket.joinRoom(roomId, user?.user_id || "");

    return () => {
      offMsg();
      offTyping();
      offStatus();
      chatSocket.leaveRoom(roomId);
    };
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
      const success = await chatSocket.sendText(roomId, user?.user_id || "", content);
      // add optimistic message to UI
      const temp: ChatMessage = {
        id: `c_${user?.user_id || "0"}`,
        room_id: roomId,
        sender_id: user?.user_id || "",
        content,
        message_type: "text",
        message_data: null,
        is_read: false,
        created_at: new Date().toISOString(),
        pending: !success,
      };
      setMessages(prev => [...prev, temp]);
      // scroll
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
    } catch (e) {
      show({
        message: "Could not send message.",
        variant: "error",
        title: "Error"
      })
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

      const uploadResult = await attemptMultipleUpload(res.assets.map((asset)=> {
        return {
          id: asset?.assetId || "",
          uri: asset?.uri || ""
        }
      }))

      console.log(uploadResult)

      // send via socket
      uploadResult.forEach(async (result)=>{
        const client_id = kind === "image"
          ? await chatSocket.sendImage(roomId, user?.user_id || "",result.urls["original"], { localUri: uri })
          : await chatSocket.sendVideo(roomId, user?.user_id || "",result.urls["original"], { localUri: uri });

        const temp: ChatMessage = {
          id: `c_${client_id}`,
          room_id: roomId,
          sender_id: user?.user_id || "",
          content: result.media.original_url || uri,
          message_type: kind === "image" ? "image" : "video",
          message_data: { url: result.media.original_url },
          is_read: false,
          created_at: new Date().toISOString(),
          pending: true,
        };
        setMessages(prev => [...prev, temp]);
      })
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
    } catch (e) {
      show({
        message: "Could not send media.",
        variant: "error",
        title: "Error"
      })
    }
  }

  // send product
  async function handlePickProduct() {
    try {
      if (!productVisible) {
        setProductVisible(true)
        //attempt to get products
        //set productList only if it is not
        if (productList.length === 0) {
          const products = await getSellerProducts(Number(user?.user_id) || 0); //ensure user_id is a number
          setProductList(products); 
        }
      }

      else {
        setSending(true);
        // optimistic ui
        currentProductIds.forEach(async (product_id)=>{
          const mock = await sendProductMessageMock(roomId, product_id, user?.user_id?.toString() || "");
          setMessages(prev => [...prev, { ...mock, pending: false }]);
          //inform server via socket (chatSocket.sendProduct)
          await chatSocket.sendProduct(roomId, user?.user_id?.toString() || "", product_id, `Sharing product ${product_id}`);
        })
        setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
      }
    } catch (e) {
      show({
        message: "Could not send product.",
        variant: "error",
        title: "Error"
      })
    } finally {
      setSending(false);
    }
  }

  // Reaction toggle (thumbs up)
  async function toggleReaction(message: ChatMessage) {
    try {
      //we check message.message_data?.reacted_by_me boolean (not provided by backend model).
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
      show({
        message: "Could not update reaction.",
        variant: "error",
        title: "Error"
      })
    }
  }

  // render items
  function renderMessage({ item }: { item: ChatMessage }) {
    const isMe = (item.sender_id === user?.user_id || item.sender_id === user?.user_id?.toString());
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
              {item.message_data?.product_id ? (
                <ChatProductDisplayComponent products={[item.message_data.product_id]}/>
              ) : null}
              {role === "buyer" && 
                <TouchableOpacity onPress={() => handleAddProductToCart(item.message_data?.product_id)} style={{ marginTop: 8, padding: 8, backgroundColor: "#e26136", borderRadius: 8 }}>
                  <Text style={{ color: "#fff", textAlign: "center" }}>Add to Cart</Text>
                </TouchableOpacity>
              }
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
      show({
        message: "Product added to cart.",
        variant: "success",
        title: "Success"
      });
    } catch (e) {
      show({
        message: "Could not add to cart.",
        variant: "error",
        title: "Error"
      });
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
      show({
        message: "Could not load more messages.",
        variant: "error",
        title: "Error"
      });
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
        ListHeaderComponent={<View style={{ padding: 12 }}>
          <ArrowLeft size={24} color="#171312" onPress={() => router.back()} />
          <Text style={{ fontWeight: "bold" }}>Chat Messages</Text>
          </View>}
        //onEndReached={loadMore}
        contentContainerStyle={{ paddingVertical: 8, paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
        //inverted
      />

      {typingUser && <Text style={{ paddingHorizontal: 16, color: "#60758a" }}>{typingUser} is typing...</Text>}

      <View style={{ padding: 12, flexDirection: "row", gap: 8, alignItems: "center" }}>
        <View style={{ flexDirection: "row", backgroundColor: "#f3e7e8", flex: 1, borderRadius: 28, paddingHorizontal: 12, alignItems: "center" }}>
          <TextInput
            value={input}
            onChangeText={(t) => {
              setInput(t);
              chatSocket.typingStart(roomId, user?.user_id || "");
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
          {
            role === "seller" && (
              <TouchableOpacity onPress={() => { /* open product picker */ handlePickProduct(); }} style={{ padding: 8 }}>
                <ShoppingBag color="#994d51" size={20} />
              </TouchableOpacity>
            )
          }
          
        </View>
        
        <TouchableOpacity onPress={handleSendText} disabled={sending} style={{ backgroundColor: "#ea2832", borderRadius: 24, height: 44, width: 44, alignItems: "center", justifyContent: "center" }}>
          <SendIcon size={18} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* Product picker */}
      <ProductPicker 
      visible={productVisible} 
        products={productList}
        selectedProducts={productList.filter(p => currentProductIds.includes(p.id))}
        onClose={
          () => {
            handlePickProduct()
            //clear current
            setCurrentProductIds([])
            setProductVisible(false)
          }
        } 
        onSelect={(product) => {
          const isAlreadyAdded = currentProductIds.find(pId => pId === product.id);
          if (!isAlreadyAdded) {
            setCurrentProductIds(prev => [...prev, product.id]);
          }
        }}
        onRemove={(product) => {
          setCurrentProductIds(prev => prev.filter(pId => pId !== product.id));
        }}/>
    </KeyboardAvoidingView>
  );
}
