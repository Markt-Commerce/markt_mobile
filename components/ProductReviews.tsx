/**
 * Reviews on a product page: read them, write one, edit or delete your own.
 *
 * None of this existed — there was no review service in the app, so a product
 * page could show a number but never the reviews behind it, and nobody could
 * leave one.
 *
 * The purchase gate shapes the UI. The server only accepts a review from
 * someone with a delivered order, and returns 403 otherwise. Rather than offer
 * a "Write a review" button that fails for most visitors, the composer opens
 * optimistically and surfaces the server's own sentence if the gate rejects it —
 * that message is written for the buyer and says exactly what's missing.
 */
import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { ThumbsUp, Pencil, Trash2, X } from "lucide-react-native";
import Avatar from "./Avatar";
import { StarRating, StarRatingInput } from "./StarRating";
import { useTheme } from "./themeProvider";
import { useToast } from "./ToastProvider";
import { useUser } from "../hooks/userContextProvider";
import {
  createProductReview,
  deleteProductReview,
  getProductReviews,
  updateProductReview,
  upvoteReview,
  type ProductReview,
} from "../services/sections/reviews";

type Props = {
  productId: string;
  /** Bubbles up so the page header can refresh its average. */
  onChanged?: () => void;
};

function relativeDate(iso?: string) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function ProductReviews({ productId, onChanged }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { show } = useToast();
  const { user } = useUser();
  const myId = user?.user_id ? String(user.user_id) : "";

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const mine = reviews.find((r) => String(r.user_id) === myId);

  const load = useCallback(async () => {
    try {
      const page = await getProductReviews(productId, 1, 20);
      setReviews(page.items);
    } catch {
      // A product page is still useful without its reviews. Failing quietly
      // beats an error banner over content that loaded fine.
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const resetComposer = () => {
    setComposing(false);
    setEditingId(null);
    setRating(0);
    setContent("");
  };

  const openComposer = (review?: ProductReview) => {
    setEditingId(review?.id ?? null);
    setRating(review?.rating ?? 0);
    setContent(review?.content ?? "");
    setComposing(true);
  };

  const submit = async () => {
    if (rating < 1) {
      show({ variant: "error", title: "Pick a rating", message: "Tap a star from 1 to 5." });
      return;
    }
    if (!content.trim()) {
      show({ variant: "error", title: "Add a few words", message: "Tell other buyers what it was like." });
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await updateProductReview(editingId, { rating, content: content.trim() });
        show({ variant: "success", title: "Review updated" });
      } else {
        await createProductReview(productId, { rating, content: content.trim() });
        show({ variant: "success", title: "Review posted", message: "Thanks for helping other buyers." });
      }
      resetComposer();
      await load();
      onChanged?.();
    } catch (e: any) {
      // The server's message is written for the buyer ("You can review this
      // after your order has been delivered") and is more use than anything
      // generic we could invent.
      const message =
        e?.message || e?.data?.message || "Could not post your review. Please try again.";
      show({ variant: "error", title: "Not posted", message });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: number) => {
    const snapshot = reviews;
    setReviews((rs) => rs.filter((r) => r.id !== id));
    try {
      await deleteProductReview(id);
      show({ variant: "success", title: "Review removed" });
      onChanged?.();
    } catch {
      setReviews(snapshot);
      show({ variant: "error", title: "Could not remove", message: "Please try again." });
    }
  };

  const helpful = async (review: ProductReview) => {
    const snapshot = reviews;
    setReviews((rs) =>
      rs.map((r) => (r.id === review.id ? { ...r, upvotes: (r.upvotes ?? 0) + 1 } : r))
    );
    try {
      const res = await upvoteReview(review.id);
      // Only reconcile if the server actually sent a count -- otherwise keep
      // the optimistic value rather than replacing it with undefined.
      if (typeof res?.new_count === "number") {
        setReviews((rs) =>
          rs.map((r) => (r.id === review.id ? { ...r, upvotes: res.new_count } : r))
        );
      }
    } catch (e: any) {
      setReviews(snapshot);
      // 409 means "you already did" — that's information, not a failure.
      const already = e?.status === 409 || /already/i.test(e?.message ?? "");
      show({
        variant: already ? "info" : "error",
        title: already ? "Already marked helpful" : "Could not mark helpful",
      });
    }
  };

  const rated = reviews.filter((r) => typeof r.rating === "number");
  const average = rated.length
    ? rated.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated.length
    : 0;

  const border = isDark ? "border-[#2f3132]" : "border-border-light";
  const muted = isDark ? "text-[#8f9195]" : "text-tertiary";
  const strong = isDark ? "text-[#f0f1f2]" : "text-black";

  return (
    <View className={`border-t ${border} pt-6`}>
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className={`font-bold text-[18px] ${strong}`}>Reviews</Text>
          {rated.length > 0 ? (
            <View className="flex-row items-center mt-1">
              <StarRating value={average} size={14} dark={isDark} />
              <Text className={`text-[13px] ml-2 ${muted}`}>
                {average.toFixed(1)} · {rated.length}{" "}
                {rated.length === 1 ? "review" : "reviews"}
              </Text>
            </View>
          ) : null}
        </View>

        {!composing && !mine ? (
          <TouchableOpacity
            onPress={() => openComposer()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Write a review"
            className="px-4 h-10 rounded-lg bg-primary items-center justify-center"
          >
            <Text className="text-white font-semibold text-[13px]">Write a review</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {composing ? (
        <View className={`rounded-xl p-4 mb-5 ${isDark ? "bg-[#2f3132]" : "bg-[#F7F7F8]"}`}>
          <View className="flex-row items-center justify-between mb-3">
            <Text className={`font-semibold text-[15px] ${strong}`}>
              {editingId ? "Edit your review" : "How was it?"}
            </Text>
            <TouchableOpacity
              onPress={resetComposer}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <X size={18} color={isDark ? "#c6c5cf" : "#71717A"} />
            </TouchableOpacity>
          </View>

          <StarRatingInput value={rating} onChange={setRating} dark={isDark} />

          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="What should other buyers know?"
            placeholderTextColor={isDark ? "#8f9195" : "#A1A1AA"}
            multiline
            maxLength={1000}
            className={`mt-4 rounded-lg px-3 py-3 text-[15px] min-h-[88px] ${
              isDark ? "bg-[#1a1c1d] text-[#f0f1f2]" : "bg-white text-black"
            }`}
            textAlignVertical="top"
            accessibilityLabel="Your review"
          />

          <TouchableOpacity
            onPress={submit}
            disabled={submitting}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ busy: submitting }}
            className={`mt-3 h-12 rounded-lg bg-primary items-center justify-center ${
              submitting ? "opacity-60" : ""
            }`}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-bold text-[15px]">
                {editingId ? "Save changes" : "Post review"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View className="py-8 items-center">
          <ActivityIndicator color={isDark ? "#f0f1f2" : "#000000"} />
        </View>
      ) : reviews.length === 0 ? (
        <View className="py-8 items-center">
          <Text className={`text-[15px] ${strong}`}>No reviews yet</Text>
          <Text className={`text-[13px] mt-1 text-center ${muted}`}>
            Buyers can review once their order arrives.
          </Text>
        </View>
      ) : (
        reviews.map((r, i) => {
          const isMine = String(r.user_id) === myId;
          return (
            <View
              key={r.id}
              className={`py-4 ${i === reviews.length - 1 ? "" : `border-b ${border}`}`}
            >
              <View className="flex-row items-center">
                <Avatar
                  uri={r.user?.profile_picture_url ?? undefined}
                  name={r.user?.username}
                  size={32}
                />
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center">
                    <Text className={`font-semibold text-[14px] ${strong}`} numberOfLines={1}>
                      {isMine ? "You" : r.user?.username || "Buyer"}
                    </Text>
                    {r.is_verified ? (
                      <View className="ml-2 px-1.5 py-0.5 rounded bg-primary-muted">
                        <Text className="text-primary text-[10px] font-bold uppercase tracking-wide">
                          Verified
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View className="flex-row items-center mt-0.5">
                    {typeof r.rating === "number" ? (
                      <StarRating value={r.rating} size={12} dark={isDark} />
                    ) : null}
                    <Text className={`text-[12px] ml-2 ${muted}`}>
                      {relativeDate(r.created_at)}
                    </Text>
                  </View>
                </View>

                {isMine ? (
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      onPress={() => openComposer(r)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      className="p-1.5"
                      accessibilityRole="button"
                      accessibilityLabel="Edit your review"
                    >
                      <Pencil size={16} color={isDark ? "#c6c5cf" : "#71717A"} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => remove(r.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      className="p-1.5"
                      accessibilityRole="button"
                      accessibilityLabel="Delete your review"
                    >
                      <Trash2 size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              {r.title ? (
                <Text className={`font-semibold text-[15px] mt-3 ${strong}`}>{r.title}</Text>
              ) : null}
              <Text className={`text-[14px] leading-[20px] mt-2 ${isDark ? "text-[#c6c5cf]" : "text-[#3F3F46]"}`}>
                {r.content}
              </Text>

              {!isMine ? (
                <TouchableOpacity
                  onPress={() => helpful(r)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Mark this review helpful. ${r.upvotes ?? 0} so far.`}
                  className="flex-row items-center mt-3 self-start px-3 h-9 rounded-full"
                  style={{ backgroundColor: isDark ? "#2f3132" : "#F4F4F5" }}
                >
                  <ThumbsUp size={13} color={isDark ? "#c6c5cf" : "#52525B"} />
                  <Text className={`text-[12px] ml-1.5 font-medium ${muted}`}>
                    Helpful{r.upvotes ? ` · ${r.upvotes}` : ""}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );
}
