import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { Crosshair, MapPin } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import { hasMapsKey } from "../../utils/maps";

interface Props {
  latitude: number;
  longitude: number;
  onChange: (next: { latitude: number; longitude: number }) => void;
  onUseCurrentLocation?: () => void;
  locating?: boolean;
  height?: number;
}

/**
 * Dragging a pin to the exact spot a rider should come to.
 *
 * A geocoded address gets a rider to the street; the pin gets them to the
 * gate. That difference is most of the delivery failures in the places Markt
 * operates, where a road may have no numbers and a landmark is the real
 * address.
 *
 * Renders a map only when a Maps key was present at build time. Without one
 * react-native-maps draws a blank grey rectangle on Android — indistinguishable
 * from a crash — so the fallback shows the coordinate and the one action that
 * still works, rather than pretending there is a map.
 */
export default function MapPinPicker({
  latitude,
  longitude,
  onChange,
  onUseCurrentLocation,
  locating,
  height = 200,
}: Props) {
  const t = useTokens();
  const [MapView, setMapView] = React.useState<any>(null);
  const [Marker, setMarker] = React.useState<any>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (!hasMapsKey()) return;
    // Required lazily so a build without the native module — Expo Go, or a
    // client built before react-native-maps was added — degrades to the
    // fallback instead of crashing on import.
    try {
      const maps = require("react-native-maps");
      setMapView(() => maps.default);
      setMarker(() => maps.Marker);
    } catch {
      setFailed(true);
    }
  }, []);

  const showMap = hasMapsKey() && MapView && !failed;

  if (!showMap) {
    return (
      <View
        className="items-center justify-center rounded-xl bg-surface-sunken px-4"
        style={{ height }}
      >
        <MapPin size={26} color={t.textMuted} strokeWidth={1.5} />
        <Text className="mt-2 text-[13px] font-semibold text-text-primary">
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </Text>
        <Text className="mt-1 text-center text-[12px] leading-4 text-text-muted">
          Map preview isn't available in this build. Use your current location
          to set the pin precisely.
        </Text>
        {onUseCurrentLocation ? (
          <TouchableOpacity
            onPress={onUseCurrentLocation}
            disabled={locating}
            accessibilityRole="button"
            className="mt-3 h-10 flex-row items-center justify-center gap-2 rounded-xl bg-primary-fill px-4"
          >
            {locating ? (
              <ActivityIndicator size="small" color={t.textOnPrimary} />
            ) : (
              <Crosshair size={16} color={t.textOnPrimary} />
            )}
            <Text className="text-[13px] font-bold text-text-on-primary">
              {locating ? "Finding you…" : "Use my location"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-xl" style={{ height }}>
      <MapView
        style={{ flex: 1 }}
        // Not animated to the pin on every render: the buyer may have panned
        // deliberately, and yanking the camera back is how a picker becomes
        // unusable.
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        }}
        onPress={(e: any) => onChange(e.nativeEvent.coordinate)}
        accessibilityLabel="Map. Tap or drag the pin to set the exact delivery point."
      >
        <Marker
          coordinate={{ latitude, longitude }}
          draggable
          onDragEnd={(e: any) => onChange(e.nativeEvent.coordinate)}
        />
      </MapView>

      <View className="absolute bottom-3 left-3 right-3 flex-row items-center justify-between">
        <View className="rounded-full bg-surface-page/90 px-3 py-1.5">
          <Text className="text-[11px] text-text-secondary">
            Tap or drag the pin
          </Text>
        </View>
        {onUseCurrentLocation ? (
          <TouchableOpacity
            onPress={onUseCurrentLocation}
            disabled={locating}
            accessibilityRole="button"
            accessibilityLabel="Move the pin to my current location"
            className="h-10 w-10 items-center justify-center rounded-full bg-surface-page"
          >
            {locating ? (
              <ActivityIndicator size="small" color={t.textPrimary} />
            ) : (
              <Crosshair size={18} color={t.textPrimary} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
