/**
 * Lets the feed's first request go out before everything else on app start.
 *
 * A signed-in cold start used to fire about eleven requests at the API in the
 * same instant: the feed, plus badges, gamification, the browse location, the
 * push token, the shop strip and the niche chips. The API speaks HTTP/1.1,
 * so each of those needs its own connection and TLS handshake, and Android's
 * HTTP client runs at most five at once per host. The rest queue, and the
 * feed -- the one thing the user is waiting for -- could be among them.
 *
 * The secondary callers await `afterFeedLoads()` before their first request.
 * The gate opens when the feed's first load settles (success or failure), or
 * after MAX_WAIT_MS regardless, so nothing waits forever when the feed is
 * slow or the user never opens it. Once open it stays open for the life of
 * the app, so later calls (foregrounding, a role switch, a refetch) go
 * straight through.
 */

const MAX_WAIT_MS = 3000;

let open = false;
let waiters: (() => void)[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function release() {
  if (open) return;
  open = true;
  if (timer) clearTimeout(timer);
  timer = null;
  const pending = waiters;
  waiters = [];
  pending.forEach((resolve) => resolve());
}

/** Called by the feed once its first load has settled. */
export function markFeedLoaded() {
  release();
}

/** Resolves once the feed has loaded, or after MAX_WAIT_MS at the latest. */
export function afterFeedLoads(): Promise<void> {
  if (open) return Promise.resolve();
  // The cap starts with the first waiter, which is effectively app start.
  if (!timer) timer = setTimeout(release, MAX_WAIT_MS);
  return new Promise((resolve) => waiters.push(resolve));
}
