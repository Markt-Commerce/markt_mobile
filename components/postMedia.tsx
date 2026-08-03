/**
 * Shared post/chat media rendering:
 *  - InlineVideo    — expo-video player for a single video (chat bubbles, tiles)
 *  - PostMediaGrid  — Instagram-style grid, max 5 tiles with a "+N" overlay
 *  - MediaViewerModal — fullscreen pager (images + videos) with X / tap-out close
 */
import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  StyleProp,
} from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { Play, X } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export type MediaItem = {
  uri: string;
  type: "image" | "video";
};

/** Best-effort discriminator for API media objects. */
export function mediaTypeOf(m: {
  media_type?: string | null;
  mime_type?: string | null;
  type?: string | null;
  url?: string | null;
}): "image" | "video" {
  const hint = (m.media_type ?? m.type ?? m.mime_type ?? "").toLowerCase();
  if (hint.includes("video")) return "video";
  const uri = m.url ?? "";
  if (/\.(mp4|mov|m4v|webm|mkv|avi)(\?|#|$)/i.test(uri)) return "video";
  return "image";
}

/* ---------------------------------- video --------------------------------- */

export function InlineVideo({
  uri,
  style,
  muted = true,
  controls = true,
  autoPlay = false,
  contentFit = "cover",
}: {
  uri: string;
  style?: StyleProp<ViewStyle>;
  muted?: boolean;
  controls?: boolean;
  autoPlay?: boolean;
  contentFit?: "cover" | "contain";
}) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = muted;
  });
  // play() in the setup callback can race the native view attaching — start
  // playback from an effect once the player exists.
  React.useEffect(() => {
    if (autoPlay) player.play();
    else player.pause();
  }, [player, autoPlay]);
  return (
    <VideoView
      player={player}
      style={style}
      contentFit={contentFit}
      nativeControls={controls}
    />
  );
}

/** Muted, control-less preview used inside grid tiles (tap opens the viewer). */
function TileVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
  });
  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

/* ---------------------------------- grid ---------------------------------- */

const GRID_GAP = 3;
const TILE_RADIUS = 8;

function Tile({
  item,
  onPress,
  style,
  overflowCount = 0,
}: {
  item: MediaItem;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  overflowCount?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tile, style]}
      accessibilityRole="imagebutton"
    >
      {item.type === "video" ? (
        // pointerEvents="none": the native video surface must not swallow the
        // tap — the Pressable opens the fullscreen viewer.
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <TileVideo uri={item.uri} />
        </View>
      ) : (
        <Image
          source={{ uri: item.uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={100}
        />
      )}
      {item.type === "video" && overflowCount === 0 && (
        <View style={styles.playOverlay} pointerEvents="none">
          <View style={styles.playBadge}>
            <Play size={18} color="#ffffff" fill="#ffffff" />
          </View>
        </View>
      )}
      {overflowCount > 0 && (
        <View style={styles.moreOverlay} pointerEvents="none">
          <Text style={styles.moreText}>+{overflowCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

/**
 * Instagram-style layout:
 *  1 → full-width;  2 → two columns;  3 → one tall + column of two;
 *  4 → 2×2;  5+ → row of two over row of three, last tile shows "+N".
 * Tapping a tile opens the fullscreen viewer (built in) unless `onPressItem`
 * is provided to override.
 */
export function PostMediaGrid({
  media,
  onPressItem,
}: {
  media: MediaItem[];
  onPressItem?: (index: number) => void;
}) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const items = media.slice(0, 5);
  const overflow = media.length - items.length;
  const open = useCallback(
    (i: number) => {
      if (onPressItem) onPressItem(i);
      else setViewerIndex(i);
    },
    [onPressItem],
  );

  if (items.length === 0) return null;

  const n = items.length;
  let body: React.ReactNode;

  if (n === 1) {
    body = (
      <Tile item={items[0]} onPress={() => open(0)} style={{ aspectRatio: 1 }} />
    );
  } else if (n === 2) {
    body = (
      <View style={[styles.row, { aspectRatio: 2 }]}>
        <Tile item={items[0]} onPress={() => open(0)} style={styles.flex1} />
        <Tile item={items[1]} onPress={() => open(1)} style={styles.flex1} />
      </View>
    );
  } else if (n === 3) {
    body = (
      <View style={[styles.row, { aspectRatio: 3 / 2 }]}>
        <Tile item={items[0]} onPress={() => open(0)} style={styles.flex2} />
        <View style={[styles.col, styles.flex1]}>
          <Tile item={items[1]} onPress={() => open(1)} style={styles.flex1} />
          <Tile item={items[2]} onPress={() => open(2)} style={styles.flex1} />
        </View>
      </View>
    );
  } else if (n === 4) {
    body = (
      <View style={styles.col}>
        <View style={[styles.row, { aspectRatio: 2 }]}>
          <Tile item={items[0]} onPress={() => open(0)} style={styles.flex1} />
          <Tile item={items[1]} onPress={() => open(1)} style={styles.flex1} />
        </View>
        <View style={[styles.row, { aspectRatio: 2 }]}>
          <Tile item={items[2]} onPress={() => open(2)} style={styles.flex1} />
          <Tile item={items[3]} onPress={() => open(3)} style={styles.flex1} />
        </View>
      </View>
    );
  } else {
    body = (
      <View style={styles.col}>
        <View style={[styles.row, { aspectRatio: 2 }]}>
          <Tile item={items[0]} onPress={() => open(0)} style={styles.flex1} />
          <Tile item={items[1]} onPress={() => open(1)} style={styles.flex1} />
        </View>
        <View style={[styles.row, { aspectRatio: 3 }]}>
          <Tile item={items[2]} onPress={() => open(2)} style={styles.flex1} />
          <Tile item={items[3]} onPress={() => open(3)} style={styles.flex1} />
          <Tile
            item={items[4]}
            onPress={() => open(4)}
            style={styles.flex1}
            overflowCount={overflow}
          />
        </View>
      </View>
    );
  }

  return (
    <View>
      {body}
      {!onPressItem && (
        <MediaViewerModal
          visible={viewerIndex !== null}
          items={media}
          initialIndex={viewerIndex ?? 0}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </View>
  );
}

/* -------------------------------- fullscreen ------------------------------- */

function ViewerPage({
  item,
  onClose,
  active,
}: {
  item: MediaItem;
  onClose: () => void;
  active: boolean;
}) {
  if (item.type === "video") {
    return (
      <View style={styles.viewerPage}>
        <InlineVideo
          uri={item.uri}
          style={styles.viewerMedia}
          muted={false}
          controls
          autoPlay={active}
          contentFit="contain"
        />
      </View>
    );
  }
  // Tap anywhere on an image page closes the viewer ("tap out of image").
  return (
    <Pressable style={styles.viewerPage} onPress={onClose}>
      <Image
        source={{ uri: item.uri }}
        style={styles.viewerMedia}
        contentFit="contain"
      />
    </Pressable>
  );
}

export function MediaViewerModal({
  visible,
  items,
  initialIndex = 0,
  onClose,
}: {
  visible: boolean;
  items: MediaItem[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const listRef = useRef<FlatList<MediaItem>>(null);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => {
        setIndex(initialIndex);
        setTimeout(
          () =>
            listRef.current?.scrollToIndex({
              index: initialIndex,
              animated: false,
            }),
          0,
        );
      }}
    >
      <View style={styles.viewerRoot}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * i,
            index: i,
          })}
          onMomentumScrollEnd={(e) =>
            setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))
          }
          renderItem={({ item, index: i }) => (
            <ViewerPage item={item} onClose={onClose} active={i === index} />
          )}
        />
        <View style={styles.viewerTopBar}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={styles.viewerClose}
            accessibilityRole="button"
            accessibilityLabel="Close fullscreen view"
          >
            <X size={22} color="#ffffff" />
          </Pressable>
          {items.length > 1 && (
            <Text style={styles.viewerCounter}>
              {index + 1}/{items.length}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tile: {
    overflow: "hidden",
    borderRadius: TILE_RADIUS,
    backgroundColor: "rgba(127,127,127,0.15)",
  },
  row: {
    flexDirection: "row",
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  col: {
    flexDirection: "column",
  },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  playBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 3,
  },
  moreOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
  },
  viewerRoot: {
    flex: 1,
    backgroundColor: "#000000",
  },
  viewerPage: {
    width: SCREEN_WIDTH,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerMedia: {
    width: "100%",
    height: "100%",
  },
  viewerTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewerClose: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  viewerCounter: {
    color: "#ffffff",
    fontSize: 13,
    marginRight: 12,
  },
});
