/**
 * User-facing error messages.
 *
 * The API layer (services/api.ts) throws Errors whose `.message` carries raw
 * backend text (validation dumps, statusText, even HTML bodies) plus a
 * `.status` code. That text is for logs only — anything shown to the user goes
 * through friendlyErrorMessage(), which maps the failure to a human sentence
 * and never echoes the server's own words.
 */
import logger from "./logger";

const STATUS_MESSAGES: Record<number, string> = {
  400: "Some of the information provided isn't valid. Please check it and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  408: "That took too long. Please try again.",
  409: "This conflicts with something that already exists.",
  410: "This is no longer available.",
  413: "That file is too large. Please try a smaller one.",
  415: "That file type isn't supported.",
  422: "Some of the information provided isn't valid. Please check it and try again.",
  429: "You're doing that a little too fast. Please wait a moment and try again.",
};

const NETWORK_ERROR_RE =
  /network request failed|failed to fetch|networkerror|timeout|timed out|abort/i;

/**
 * Map any thrown value to a message safe to show the user.
 *
 * @param err       The caught error (any shape).
 * @param fallback  Context-specific message when the failure isn't one of the
 *                  recognised cases, e.g. "Could not send your message."
 * @param overrides Per-status overrides for context, e.g. on login
 *                  `{ 401: "Incorrect email or password." }`.
 */
export function friendlyErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
  overrides?: Record<number, string>,
): string {
  // Keep the real error visible to developers — never to users.
  logger.error("[error->user]", err);

  const status = (err as { status?: unknown } | null | undefined)?.status;
  if (typeof status === "number") {
    if (overrides?.[status]) return overrides[status];
    if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
    if (status >= 500)
      return "Our servers are having a moment. Please try again shortly.";
  }

  const rawMsg =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "";
  if (NETWORK_ERROR_RE.test(rawMsg))
    return "Couldn't connect. Please check your internet connection and try again.";

  return fallback;
}
