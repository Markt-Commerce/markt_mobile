/**
 * Requests — My requests (buyer) | Browse requests (buyer + seller)
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, FileText, Plus } from "lucide-react-native";
import { useUser } from "../../hooks/userContextProvider";
import { getBuyerRequests } from "../../services/sections/feed";
import type { BuyerRequest } from "../../models/feed";
import RequestDisplayComponent from "../../components/requestDisplayComponent";

export default function RequestsScreen() {
  const router = useRouter();
  const { role } = useUser();
  const [tab, setTab] = useState<"my" | "browse">(role === "buyer" ? "my" : "browse");
  const [items, setItems] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await getBuyerRequests(1, 20);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchRequests();
  }, [fetchRequests, tab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-border">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 rounded-full bg-bg-muted items-center justify-center">
            <ArrowLeft size={18} color="#171311" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-text-primary">Requests</Text>
          <View className="w-10" />
        </View>

        {/* Tabs */}
        <View className="flex-row rounded-xl bg-bg-muted p-1">
          {role === "buyer" && (
            <TouchableOpacity
              onPress={() => setTab("my")}
              className={`flex-1 py-2 rounded-lg items-center ${tab === "my" ? "bg-text-primary" : ""}`}
            >
              <Text className={`text-sm font-semibold ${tab === "my" ? "text-white" : "text-text-secondary"}`}>
                My requests
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setTab("browse")}
            className={`flex-1 py-2 rounded-lg items-center ${tab === "browse" ? "bg-text-primary" : ""}`}
          >
            <Text className={`text-sm font-semibold ${tab === "browse" ? "text-white" : "text-text-secondary"}`}>
              Browse
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center py-16">
          <ActivityIndicator size="large" color="#e26136" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RequestDisplayComponent req={item} />
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16 px-6">
              <View className="w-20 h-20 rounded-full bg-bg-muted items-center justify-center mb-4">
                <FileText size={32} color="#876d64" />
              </View>
              <Text className="text-text-primary font-semibold text-lg text-center">
                {tab === "my" ? "No requests yet" : "No open requests"}
              </Text>
              <Text className="text-text-secondary text-sm mt-2 text-center">
                {tab === "my" && role === "buyer"
                  ? "Create a request to tell sellers what you need."
                  : "Check back later for new requests."}
              </Text>
              {tab === "my" && role === "buyer" && (
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)")}
                  className="mt-6 h-12 px-6 rounded-full bg-primary items-center justify-center"
                >
                  <Text className="text-white font-semibold">Create request</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e26136" />
          }
        />
      )}
    </SafeAreaView>
  );
}
