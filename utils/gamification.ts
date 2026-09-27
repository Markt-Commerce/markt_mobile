/** Human-readable labels for point ledger reasons (Appendix A keys). */
const REASON_LABELS: Record<string, string> = {
  order_completed_buyer: "Order completed",
  order_completed_seller: "Sale completed",
  review_with_photo: "Review with photo",
  review_text_only: "Review posted",
  post_created: "Post created",
  post_reaction_received: "Post reaction",
  profile_completed: "Profile completed",
  referral_first_paid: "Referral bonus",
  daily_first_login: "Daily login",
  order_reversed: "Order reversed",
};

export function reasonLabel(reason: string): string {
  return (
    REASON_LABELS[reason] ??
    reason.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
