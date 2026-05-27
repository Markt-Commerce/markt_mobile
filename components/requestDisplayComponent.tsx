import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { BuyerRequest } from "../models/feed";
import { Link } from "expo-router";
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
            <TouchableOpacity onPress={() => router.push(`/requestDetails/${req.id}`)} activeOpacity={0.85}>
                <View className="px-4 pt-4">
                    <View className="rounded-card border border-border bg-white p-4">
                        <View className="flex-row items-center mb-3">
                            <Image
                                source={{
                                    uri:
                                        req.buyer?.profile_picture_url ||
                                        "https://placehold.co/40x40?text=User",
                                }}
                                className="w-10 h-10 rounded-full mr-3"
                            />
                            <View>
                                <Text className="font-semibold text-text-primary">
                                    {req.buyer?.username || "Unknown buyer"}
                                </Text>
                                <Text className="text-xs text-text-secondary">Buyer request</Text>
                            </View>
                        </View>

                        <Text
                            className="font-bold text-text-primary text-base mb-1"
                            numberOfLines={2}
                        >
                            {req.title || "Untitled request"}
                        </Text>
                        <Text className="text-text-muted text-sm mb-3" numberOfLines={3}>
                            {req.description || "No description provided."}
                        </Text>

                        <View className="flex-row items-center justify-between">
                            <View>
                                <Text className="text-sm text-primary font-semibold">
                                    Budget: ${req.budget ?? "N/A"}
                                </Text>
                                <Text className="text-[11px] text-text-muted">
                                    Deadline: {formatDeadline(req.deadline)}
                                </Text>
                            </View>
                            <TouchableOpacity
                                className="px-4 py-2 bg-primary rounded-full"
                                onPress={() => onMessagePress?.()}
                                activeOpacity={0.85}
                            >
                                <Text className="text-white text-sm font-semibold">
                                    Message Buyer
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
    );
};

export default RequestDisplayComponent;