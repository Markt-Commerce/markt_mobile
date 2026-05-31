// components/ToastProvider.tsx
import React, { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { X, AlertCircle, CheckCircle2, Info } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastVariant = "error" | "success" | "info";
type ToastInput = { title?: string; message?: string; variant?: ToastVariant; duration?: number };
type ToastItem = { id: string; title?: string; message?: string; variant: ToastVariant; duration: number };
type ToastContextValue = { show: (t: ToastInput) => void; hide: (id: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

const variantUI = {
  error: { icon: AlertCircle, container: "bg-red-50 border-red-200", title: "text-red-900", message: "text-red-700" },
  success:{ icon: CheckCircle2, container: "bg-emerald-50 border-emerald-200", title: "text-emerald-900", message: "text-emerald-700" },
  info:  { icon: Info, container: "bg-sky-50 border-sky-200", title: "text-sky-900", message: "text-sky-700" },
} as const;

const ToastBubble = ({ item, onClose, index }: { item: ToastItem; onClose: (id: string) => void; index: number }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current; // slide up from bottom

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start();

    const timeout = setTimeout(() => handleClose(), item.duration || 6000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 10, duration: 120, useNativeDriver: true }),
    ]).start(({ finished }) => finished && onClose(item.id));
  };

  const v = variantUI[item.variant];
  const Icon = v.icon;

  return (
    <Animated.View
      pointerEvents="auto"
      style={{ opacity, transform: [{ translateY }], zIndex: 1000 - index }}
      className={`mx-4 mt-2 rounded-2xl border ${v.container} shadow-sm`}
    >
      <View className="flex-row items-start px-4 py-3">
        <View className="mt-0.5 mr-3">
          <Icon size={20} color="#0f172a" />
        </View>
        <View className="flex-1">
          {!!item.title && <Text className={`font-semibold ${v.title}`}>{item.title}</Text>}
          {!!item.message && <Text className={`mt-0.5 ${v.message}`}>{item.message}</Text>}
        </View>
        <TouchableOpacity onPress={handleClose} className="ml-3 p-1 active:opacity-70">
          <X size={18} color="#0f172a" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();

  const show = useCallback((t: ToastInput) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [
      { id, title: t.title, message: t.message, variant: t.variant ?? "info", duration: t.duration ?? 6000 },
      ...prev,
    ]);
  }, []);

  const hide = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const value = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* BOTTOM overlay stack (safe-area aware) */}
      <View
        pointerEvents="box-none"
        className="absolute inset-x-0 z-50"
        style={{ bottom: insets.bottom ? insets.bottom + 12 : 16 }}
      >
        {toasts.map((t, idx) => (
          <ToastBubble key={t.id} item={t} onClose={hide} index={idx} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};
