import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { BuyerRequest } from "../models/feed";
import { router } from "expo-router";

type Buyer = {
    profile_picture_url?: string;
    username?: string;
};

type Props = {
    req: BuyerRequest;
    onMessagePress?: () => void;
};

const formatDeadline = (d?: string | number | Date) => {
    if (!d) return "No deadline";
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toDateString();
};

const RequestDisplayComponent: React.FC<Props> = ({ req, onMessagePress }) => {
    return (
        <TouchableOpacity onPress={() => router.push(`/requestDetails/${req.id}`)} activeOpacity={0.85} className="px-6 pt-6">
            <View className="rounded border border-border bg-white p-5">
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center flex-1 pr-3">
                        <Image
                            source={{
                                uri:
                                    req.buyer?.profile_picture_url ||
                                    "https://placehold.co/40x40?text=User",
                            }}
                            className="w-10 h-10 rounded mr-3 bg-surface"
                        />
                        <View>
                            <Text className="font-geist font-bold text-black text-base">
                                {req.buyer?.username || "Unknown buyer"}
                            </Text>
                            <View className="mt-1 flex-row items-center">
                                <View className="h-1.5 w-1.5 rounded bg-primary mr-2" />
                                <Text className="text-[10px] font-geist font-bold text-tertiary uppercase tracking-wider">Buyer request</Text>
                            </View>
                        </View>
                    </View>
                    <View className="px-3 py-1.5 rounded bg-surface border border-border">
                        <Text className="text-[10px] font-geist font-bold text-black uppercase tracking-wider">
                            Open
                        </Text>
                    </View>
                </View>

                <Text
                    className="font-geist font-bold text-black text-lg mb-1"
                    numberOfLines={2}
                >
                    {req.title || "Untitled request"}
                </Text>
                <Text className="text-tertiary font-inter text-sm mb-4 leading-6" numberOfLines={3}>
                    {req.description || "No description provided."}
                </Text>

                <View className="flex-row items-center justify-between border-t border-border pt-4">
                    <View>
                        <Text className="text-base font-geist font-bold text-black">
                            ₦{(req.budget ?? 0).toLocaleString()}
                        </Text>
                        <Text className="text-[11px] font-inter text-tertiary mt-0.5">
                            Deadline: {formatDeadline(req.deadline)}
                        </Text>
                    </View>
                    <TouchableOpacity
                        className="px-5 py-2.5 bg-primary rounded"
                        onPress={() => onMessagePress?.()}
                        activeOpacity={0.85}
                    >
                        <Text className="text-white text-xs font-geist font-bold tracking-[1px] uppercase">
                            Message
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default RequestDisplayComponent;