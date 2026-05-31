import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Dimensions, FlatList, Modal, Pressable, StatusBar, Text, View, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export type PickedImage = {
  id: string;
  uri: string;
  fileName?: string | null;
  width?: number;
  height?: number;
};

export type InstagramGridProps = {
  value?: PickedImage[];
  onChange?: (images: PickedImage[]) => void;
  numColumns?: number;
  max?: number;
  onPressItem?: (image: PickedImage, index: number) => void;
  gap?: number;
  showFloatingAdd?: boolean;
  emptyPlaceholdersCount?: number;
  enableRemoveOnLongPress?: boolean;
  emptyLabel?: string;
  previewEnabled?: boolean;
};

export default function InstagramGrid({
  value,
  onChange,
  numColumns = 3,
  max,
  onPressItem,
  gap = 2,
  showFloatingAdd = true,
  emptyPlaceholdersCount = 9,
  enableRemoveOnLongPress = true,
  emptyLabel = "No posts yet",
  previewEnabled = true,
}: InstagramGridProps) {
  const [internalImages, setInternalImages] = useState<PickedImage[]>(value ?? []);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const viewerRef = useRef<FlatList<PickedImage>>(null);

  useEffect(() => {
    if (value) setInternalImages(value);
  }, [value]);

  const images = internalImages;

  const setImages = useCallback(
    (next: PickedImage[]) => {
      if (!value) setInternalImages(next);
      onChange?.(next);
    },
    [onChange, value]
  );

  const canAddMore = max === undefined || images.length < max;

  const askPermissionIfNeeded = useCallback(async () => {
    const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      if (canAskAgain) {
        Alert.alert("Permission needed", "We need access to your photo library to add images.", [{ text: "OK" }]);
      }
      return false;
    }
    return true;
  }, []);

  const handlePick = useCallback(async () => {
    if (!canAddMore) {
      Alert.alert("Limit reached", `You can only add up to ${max} image${max && max > 1 ? "s" : ""}.`);
      return;
    }
    const ok = await askPermissionIfNeeded();
    if (!ok) return;

    try {
      const remaining = max ? Math.max(0, max - images.length) : undefined;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.9,
      } as any);

      if (result.canceled) return;

      const picked = result.assets?.map((a) => ({
        id: `${a.assetId || a.fileName || a.uri}-${a.width || 0}x${a.height || 0}`,
        uri: a.uri,
        fileName: (a as any).fileName ?? null,
        width: a.width,
        height: a.height,
      })) ?? [];

      const next = [...images, ...picked].slice(0, max ?? Number.MAX_SAFE_INTEGER);
      setImages(next);
    } catch (e: any) {
      console.warn("Image picking failed", e);
      Alert.alert("Oops", "Something went wrong while picking images.");
    }
  }, [askPermissionIfNeeded, canAddMore, images, max, setImages]);

  const gridData = useMemo(() => {
    if (images.length === 0) {
      return Array.from({ length: emptyPlaceholdersCount }, (_, i) => ({ kind: "placeholder" as const, id: `placeholder-${i}` }));
    }
    return images.map((img) => ({ kind: "image" as const, id: img.id, img }));
  }, [images, emptyPlaceholdersCount]);

  const openViewer = useCallback((index: number) => {
    if (!previewEnabled) return;
    setViewerIndex(index);
    setViewerVisible(true);
    setTimeout(() => {
      viewerRef.current?.scrollToIndex({ index, animated: false });
    }, 0);
  }, [previewEnabled]);

  const renderTile = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const marginStyle = { margin: gap / 2 } as const;
      const sizeStyle = { aspectRatio: 1 } as const;

      if (item.kind === "placeholder") {
        return <View className="bg-neutral-200 border border-dashed border-neutral-300 rounded-md flex-1" style={[sizeStyle, marginStyle]} />;
      }

      const { img } = item as { kind: "image"; id: string; img: PickedImage };
      const onPress = () => {
        onPressItem?.(img, index);
        openViewer(index);
      };
      const onLongPress = () => {
        if (!enableRemoveOnLongPress) return;
        Alert.alert("Remove photo?", "This will remove it from the grid.", [
          { text: "Cancel", style: "cancel" },
          { text: "Remove", style: "destructive", onPress: () => setImages(images.filter((p) => p.id !== img.id)) },
        ]);
      };

      return (
        <Pressable onPress={onPress} onLongPress={onLongPress} android_ripple={{ color: "#00000022" }} className="relative bg-neutral-100 rounded-md overflow-hidden flex-1" style={[sizeStyle, marginStyle]}>
          <Image source={{ uri: img.uri }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        </Pressable>
      );
    },
    [enableRemoveOnLongPress, gap, images, onPressItem, openViewer, setImages]
  );

  const keyExtractor = useCallback((entry: any) => entry.id, []);

  const getItemLayout = useCallback((_: ArrayLike<PickedImage> | null | undefined, index: number) => ({
    length: SCREEN_WIDTH,
    offset: SCREEN_WIDTH * index,
    index,
  }), []);

  return (
    <View className="w-full">
      {images.length === 0 && !!emptyLabel && <Text className="text-center text-neutral-500 mb-2">{emptyLabel}</Text>}

      <View className="w-full" style={{ padding: gap / 2 }}>
        <FlatList
          data={gridData}
          keyExtractor={keyExtractor}
          numColumns={numColumns}
          renderItem={renderTile}
          scrollEnabled={false}
          removeClippedSubviews
          initialNumToRender={12}
          windowSize={7}
          key={numColumns}
        />
      </View>

      {showFloatingAdd && (
        <Pressable onPress={handlePick} android_ripple={{ color: "#ffffff55" }} className="absolute right-4 bottom-4 w-14 h-14 rounded-full items-center justify-center bg-black">
          <Text className="text-white text-2xl">＋</Text>
        </Pressable>
      )}

      <Modal visible={viewerVisible} transparent={false} onRequestClose={() => setViewerVisible(false)}>
        <View className="flex-1 bg-black">
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <FlatList
            ref={viewerRef}
            data={images}
            keyExtractor={(it) => it.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={viewerIndex}
            getItemLayout={getItemLayout}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setViewerIndex(idx);
            }}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH, height: "100%", backgroundColor: "#000" }}>
                <Image source={{ uri: item.uri }} className="w-full h-full" contentFit="contain" />
              </View>
            )}
          />

          <View className="absolute top-0 left-0 right-0 h-14 px-2 flex-row items-center justify-between">
            <Pressable onPress={() => setViewerVisible(false)} android_ripple={{ color: "#ffffff22" }} className="p-3">
              <Text className="text-white text-xl">✕</Text>
            </Pressable>
            <Text className="text-white text-sm mr-3">{images.length ? `${viewerIndex + 1}/${images.length}` : ""}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
