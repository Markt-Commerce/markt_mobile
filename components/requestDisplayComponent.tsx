import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { BuyerRequest } from "../models/feed";

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
        <View className="px-4 pt-3">
            <View className="rounded-2xl border border-[#efe9e7] bg-white p-4">
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
                        <Text className="font-semibold text-[#111418]">
                            {req.buyer?.username || "Unknown buyer"}
                        </Text>
                        <Text className="text-xs text-[#876d64]">Buyer request</Text>
                    </View>
                </View>

                <Text
                    className="font-bold text-[#111418] text-[16px] mb-1"
                    numberOfLines={2}
                >
                    {req.title || "Untitled request"}
                </Text>
                <Text className="text-[#60758a] mb-3" numberOfLines={3}>
                    {req.description || "No description provided."}
                </Text>

                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-sm text-[#e26136] font-semibold">
                            Budget: ${req.budget ?? "N/A"}
                        </Text>
                        <Text className="text-[11px] text-[#60758a]">
                            Deadline: {formatDeadline(req.deadline)}
                        </Text>
                    </View>
                    <TouchableOpacity
                        className="px-3 py-2 bg-[#e26136] rounded-full"
                        onPress={onMessagePress}
                    >
                        <Text className="text-white text-sm font-semibold">
                            Message Buyer
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default RequestDisplayComponent;