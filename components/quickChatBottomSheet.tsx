import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'
import ChatScreen, {ChatProps} from './chat'
import { createOrGetRoom } from '../services/sections/chat'
import { ChatRoomLite } from '../models/chat'
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import { useToast } from './ToastProvider'

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
    const { show } = useToast();

    //states for get room data results
    const [roomData, setRoomData] = useState<ChatRoomLite | null>(null)

    useEffect(() => {
        const fetchRoomData = async () => {
            if (!sellerId || !buyerId) {
                show({ variant: "error", title: "Invalid IDs", message: "Seller ID and Buyer ID must be provided.Check that you are logged in or that the user you are trying to chat with exists." });
                return;
            }
            try { 
                const result = await createOrGetRoom({
                    seller_id: sellerId,
                    buyer_id: buyerId
                });
                console.log("fetched or created room: ", result);
                setRoomData(result)
            } catch (error) {
                console.error("could not get the chat data ", error);
            }
        };
        fetchRoomData();
    }, [sellerId,buyerId]);

    return (
        <BottomSheet ref={sheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose>
            <BottomSheetView className="flex-1 p-2">
                <ChatScreen
                    route={{ params: { roomId: roomData ? roomData.id : 0 } } }
                    navigation={null}
                />
            </BottomSheetView>
        </BottomSheet>
    );
}
