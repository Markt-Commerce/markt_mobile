import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'
import ChatScreen, {ChatProps} from './chat'
import { createOrGetRoom } from '../services/sections/chat'
import { ChatRoomLite } from '../models/chat'
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types'

type QuickChatBottomSheetProps = {
    sellerId: string;
    buyerId: string;
    sheetRef: React.RefObject<BottomSheetMethods | null>;
};


export default function QuickChatBottomSheet({
    sellerId,
    buyerId,
    sheetRef
}: QuickChatBottomSheetProps) {

    //const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['80%'], []);

    //states for get room data results
    const [roomData, setRoomData] = useState<ChatRoomLite | null>(null)

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const result = await createOrGetRoom({
                    seller_id: sellerId,
                    buyer_id: buyerId
                });
                setRoomData(result)
            } catch (error) {
                console.error("could not get the chat data ", error);
            }
        };
        fetchRoomData();
    }, [sellerId,buyerId]);

    const chatRouteParams = {
        roomId: roomData?.id || 0,
    };

    return (
        <BottomSheet ref={sheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose>
            <BottomSheetView className="flex-1 p-2">
                <ChatScreen
                    route={{ params: chatRouteParams }}
                    navigation={null}
                />
            </BottomSheetView>
        </BottomSheet>
    );
}
