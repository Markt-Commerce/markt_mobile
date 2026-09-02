/**
 * Trust & safety — reporting content and blocking people.
 *
 * Required by App Store Review Guideline 1.2 for apps carrying user-generated
 * content, which Markt does in posts, listings and chat.
 */

import { BASE_URL, request } from "../api";
import { unwrapApi } from "../../utils/apiUnwrap";

export type ReportableType = "post" | "product" | "comment" | "chat_message" | "user";

export type ReportReason =
  | "spam"
  | "harassment"
  | "hate_speech"
  | "violence"
  | "nudity"
  | "scam_or_fraud"
  | "counterfeit"
  | "illegal_item"
  | "other";

/**
 * Reasons in the order they're offered, with copy written for the person
 * tapping rather than for the moderation queue. Ordered by how often each is
 * likely to be the real answer, so most people never scroll.
 */
export const REPORT_REASONS: {
  value: ReportReason;
  label: string;
  hint: string;
  /** Only offered for the content types where it makes sense. */
  appliesTo?: ReportableType[];
}[] = [
  { value: "spam", label: "Spam or misleading", hint: "Repetitive, fake, or not what it claims to be" },
  { value: "scam_or_fraud", label: "Scam or fraud", hint: "Trying to take money or details dishonestly" },
  {
    value: "counterfeit",
    label: "Counterfeit item",
    hint: "Fake or knock-off goods",
    appliesTo: ["product", "post"],
  },
  {
    value: "illegal_item",
    label: "Prohibited item",
    hint: "Something that can't be sold here",
    appliesTo: ["product", "post"],
  },
  { value: "harassment", label: "Harassment or bullying", hint: "Targeting or intimidating someone" },
  { value: "hate_speech", label: "Hate speech", hint: "Attacks a group or identity" },
  { value: "nudity", label: "Nudity or sexual content", hint: "Explicit images or text" },
  { value: "violence", label: "Violence or harm", hint: "Threats, or graphic content" },
  { value: "other", label: "Something else", hint: "Tell us in your own words" },
];

export function reasonsFor(type: ReportableType) {
  return REPORT_REASONS.filter((r) => !r.appliesTo || r.appliesTo.includes(type));
}

export interface ReportResult {
  report_id: string | null;
  status: string;
  already_reported: boolean;
  message: string;
}

export async function reportContent(
  contentType: ReportableType,
  contentId: string,
  reason: ReportReason,
  details?: string
): Promise<ReportResult> {
  const res = await request<ReportResult | { data: ReportResult }>(
    `${BASE_URL}/moderation/reports`,
    {
      method: "POST",
      body: JSON.stringify({
        content_type: contentType,
        content_id: contentId,
        reason,
        ...(details?.trim() ? { details: details.trim() } : {}),
      }),
    }
  );
  return unwrapApi(res);
}

export interface BlockResult {
  blocked: boolean;
  user_id: string;
}

export async function blockUser(userId: string): Promise<BlockResult> {
  const res = await request<BlockResult | { data: BlockResult }>(
    `${BASE_URL}/moderation/blocks/${userId}`,
    { method: "POST" }
  );
  return unwrapApi(res);
}

export async function unblockUser(userId: string): Promise<BlockResult> {
  const res = await request<BlockResult | { data: BlockResult }>(
    `${BASE_URL}/moderation/blocks/${userId}`,
    { method: "DELETE" }
  );
  return unwrapApi(res);
}

export interface BlockedUser {
  user_id: string;
  username: string;
  profile_picture: string | null;
  blocked_at: string | null;
}

export async function listBlockedUsers(): Promise<BlockedUser[]> {
  const res = await request<{ blocked: BlockedUser[] } | { data: { blocked: BlockedUser[] } }>(
    `${BASE_URL}/moderation/blocks`,
    { method: "GET" }
  );
  return unwrapApi(res)?.blocked ?? [];
}
