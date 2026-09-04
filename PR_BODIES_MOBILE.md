# PR bodies — markt_mobile

**Four PRs.** Three branch from `develop`; `feature/moderation-and-saved-ui`
branches from `feature/feed-optimization-and-wiring` because it modifies the same
feed cards — merge that one **after** its parent. **All four depend
on a backend PR being deployed first** — noted in each. Merging any of them
ahead of its backend counterpart gives users 404s on a payment screen, a
compliance screen, or the new profile screen.

There is no JS unit-test runner in this repo (no `test` script, no jest config),
so "unit test coverage report" is genuinely N/A for all three. What I can report
instead is the TypeScript baseline and, for the two API-facing branches, the
backend smoke run that verified the exact response shapes these screens consume.
Each of these still needs a device pass — stated explicitly per PR.

---
---

# PR 1 — `feature/feed-optimization-and-wiring` → `develop`

**Title:** `perf(feed): fix feed rendering, pagination races and dead actions`

## Description

Rendering and wiring pass over the home feed.

**Dead/broken flows fixed:**

- **The post author header linked nowhere.** The card's docstring has always
  claimed it went to a profile; it never did, and it couldn't — `shopDetails`
  takes a numeric seller id, post authors can be buyers, and
  `GET /users/<id>/public` was a stub with an empty schema that 500'd. With
  that endpoint implemented (backend PR 8) there is finally a destination, so
  this PR adds `/profile/[id]` — avatar, username, join date,
  post/follower/following counts, follow/unfollow with optimistic rollback, and
  a card through to the shop for sellers.
- **The comment button did nothing.** It was a `Pressable` with no `onPress` —
  which still registers a touch responder, so it swallowed the tap rather than
  letting the parent `Link` navigate. Now pushes to the post detail screen.
- **The shop name on product cards was unreachable.** It sat inside the
  card-wide `Link`, so tapping it opened the product like everywhere else on the
  card — there was no way to get from the feed to a shop. Now routes to
  `/shopDetails/<seller_id>`, matching what `productDetails` already does.
- **Like and follow state never re-synced.** Both cards captured counts into
  `useState` at mount only, so a pull-to-refresh returning updated counts for the
  same id left the card showing stale numbers, and two cards for the same seller
  could disagree.

**Pagination and caching (`useFeed`):**

- `refresh()` cleared the list before fetching, so every row unmounted and the
  empty state flashed between the tap and the response.
- The screen ran its own `refresh()` effect on mount, discarding the items the
  module cache had just seeded. Tab loading moves into the hook, which serves a
  warm cache instantly and revalidates silently past a 2-minute TTL.
- Switching tabs mid-request let the old tab's response land in the new tab's
  list. Responses now check they are still the newest request for the
  still-selected tab.
- `loadMore` closed over `items`, so its identity changed on every page and
  defeated any memo downstream; it reads through refs now.
- Split the single `loading` flag into `initialLoading` vs `refreshing`, so a
  cold tab shows a centered spinner rather than the pull-to-refresh control.

**Rendering:**

- Neither feed card was memoized, so every render of the screen — including each
  scroll-threshold crossing that collapses the shop strip — re-rendered every
  visible row. Both are now `React.memo` with comparators over the fields they
  actually read, with handlers stabilized so fresh closures don't defeat them.
- `Avatar` and `SkeletonImage` were the last image call sites still on React
  Native's `Image` (no cross-screen cache, full-resolution decodes). Moved to
  `expo-image`, already the convention in `postMedia.tsx`, with memory+disk
  caching and a `recyclingKey` so a reused row can't flash the previous row's
  picture.
- Tuned the virtualization window for tall image rows, memoized/hoisted
  `renderItem`, the header, the scroll handler, `keyExtractor` and the constant
  list props.
- Put a 60s TTL on the niche-chip and profile fetches, which previously fired on
  every single focus of the home tab.

## Tickets

Ticket ID [link]

## Related Issue

Fixes #[Issue number]

## Type of Change

- [x] Bug fix
- [x] New feature <!-- public profile screen -->
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?

**Unit test coverage report: N/A** — this repo has no JS test runner configured
(no `test` script, no jest setup). Nothing was removed; there was nothing to run.

**TypeScript:** `tsc --noEmit` reports **14 errors, byte-identical to the
pre-existing `develop` baseline**, none in any file this PR touches. All 14 are
missing native modules not installed in this checkout (`expo-video`,
`expo-notifications`, `react-native-qrcode-svg`, `expo-task-manager`,
`expo-background-task`, `expo-device`, `expo-image-manipulator`). Verified by
running `tsc` on `develop` and on this branch and diffing the output.

**Backend flows exercised against a real local server** (as part of the wallet
smoke run) to confirm the endpoints these changes call behave as assumed: feed
returns mixed post/product items with unique ids and the pagination fields the
hook relies on; like and comment persist; `seller.id` is present on product items
and `/users/shops/<seller_id>` resolves (the shop-tap destination); product view
tracking accepts; add-to-cart and follow both succeed.

**Still needs a device pass.** Not verified on a device or simulator: actual
scroll smoothness and the jank the memoization targets, image cache behaviour
under real network conditions, the shop-strip collapse animation, and the new
profile screen's navigation, pull-to-refresh and follow toggle. The reasoning is
sound and the types check, but I did not run the app.

## Tested & Approved by?

[QA Engineer]

## Checklist

- [x] My code follows the project's style guidelines
- [x] I have performed a self-review of my code
- [x] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [x] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [x] New and existing unit tests pass locally with my changes

## Additional Notes

- No tests added because there is no test infrastructure in this repo. Worth a
  separate conversation about standing up jest + React Native Testing Library —
  `useFeed`'s pagination/race logic is exactly the kind of thing that wants unit
  tests, and I'd have written them if there were somewhere to put them.
- **`Avatar` and `SkeletonImage` are used well beyond the feed** (chat bubbles,
  list items, product detail). The API is unchanged and `expo-image` was already
  a dependency in use, but that is the widest blast radius in this PR and the
  thing most worth a careful look on device.
- **Depends on backend `feat/public-profile` being deployed** — the new
  `/profile/[id]` screen calls `GET /users/<id>/public`, which was a stub until
  that PR. Without it the screen shows its error state.
- `getUserPublicProfile` was typed `Promise<any>` returning `{ items: [] }` — a
  shape that endpoint never returned and never could. Now properly typed.
- **Backend now exists, mobile UI still to come:** content reporting and user
  blocking (backend PR 6, an App Store 1.2 requirement) and saved/wishlist
  (backend PR 7) both have verified endpoints but no UI yet. Report and save
  actions on the feed cards are the natural next piece of work.
- **Still absent everywhere:** buy-now. Not requested; flagging it.
- `useGamificationLookup` issues one request per unique author. It is cached per
  user id for the session and dedupes in-flight promises, so ten posts by ten
  authors costs ten requests once. A batch endpoint would remove them.

---
---

# PR 2 — `feature/wallet-mobile-wiring` → `develop`

**Title:** `feat(wallet): add wallet screen with balance, history, funding and withdrawal`

## Description

**There was no wallet screen at all.** The ledger already backed paying for
orders from wallet, seller settlement and refunds, but
`services/sections/wallet.ts` had exactly two functions and `getWallet` was
called from one place — the balance line on the checkout payment-method screen.
Users had no way to see their balance, read their history, fund the wallet, or
withdraw, despite the backend exposing all of it.

Adds:

- **`/wallet`** — balance, paginated transaction history with credit/debit
  treatment, fund and withdraw.
- **`/wallet/topup`** — Paystack's hosted checkout in a WebView, mirroring the
  existing checkout payscreen.
- The missing API surface: `getWalletTransactions`, `requestWithdrawal`,
  `getWithdrawals`, `verifyWalletTopUp`, plus the backend's minimum-amount
  constants so the UI enforces the same floors rather than round-tripping to
  discover them.
- `utils/walletDeepLink.ts` for the `markt://wallet/success|failed` return.
- Entry point from Settings.

**On return from the webview the screen calls the server's verify endpoint
rather than trusting the redirect** — the client is never the authority on
whether money moved. When Paystack hasn't settled yet that is reported as
*processing*, not failed: the webhook will finish crediting, and telling someone
who just paid that it failed is the worst available outcome. Balance re-reads on
focus so returning from top-up shows the new figure without a manual refresh.

## Tickets

Ticket ID [link]

## Related Issue

Fixes #[Issue number]

## Type of Change

- [x] Bug fix <!-- withdrawal response type -->
- [x] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?

**Unit test coverage report: N/A** — no JS test runner in this repo.

**TypeScript:** `tsc --noEmit` at **14 errors, identical to the `develop`
baseline**, none in any file this PR touches.

**Every endpoint this screen calls was verified over real HTTP** against a local
server with Paystack TEST keys, and the response shapes were read back and
matched against the TypeScript types:

| Call | Verified |
|---|---|
| `getWallet()` → `GET /wallet/` | ✅ returns `{currency, available_balance}` |
| `getWalletTransactions()` → `GET /wallet/transactions` | ✅ `{transactions[], pagination}`; ledger sums exactly to the reported balance |
| `initializeWalletTopUp()` → `POST /wallet/topup/initialize` | ✅ 201 with `authorization_url` + `reference` |
| `verifyWalletTopUp()` → `GET /wallet/topup/<id>/verify` | ✅ 200; unpaid top-up correctly reports `verified: false` and does not credit |
| `requestWithdrawal()` → `POST /wallet/withdraw` | ✅ 201 |
| `getWithdrawals()` → `GET /wallet/withdrawals` | ✅ 200 |
| Deep link return | ✅ callback redirects to `markt://wallet/<status>?topup_id=…`, which `parseWalletDeepLink` handles |

That exercise found and fixed one bug in this branch: `requestWithdrawal` was
typed as returning the full `Withdrawal` row, but the create endpoint sends only
five fields — the rest come from the list endpoint. Split into
`WithdrawalReceipt` (create) and `Withdrawal extends WithdrawalReceipt` (list).
It also surfaced a backend bug — the create endpoint returned
`"WithdrawalStatus.PENDING"` instead of `"pending"` — fixed in the
`feature/wallet-audit` PR.

**Still needs a device pass.** Not verified on a device or simulator: the
WebView top-up journey end to end with a Paystack test card, the deep-link
interception on iOS and Android, and the modal/keyboard behaviour on the fund
and withdraw sheets. The API contract is verified; the UI is not.

## Tested & Approved by?

[QA Engineer]

## Checklist

- [x] My code follows the project's style guidelines
- [x] I have performed a self-review of my code
- [x] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [x] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [x] New and existing unit tests pass locally with my changes

## Additional Notes

- **Depends on `feature/wallet-audit` (backend) being deployed first.** The
  top-up flow calls `GET /wallet/topup/<id>/verify`, and the callback route it
  returns through, both of which are added there. Without it, funding fails.
- **The withdrawal form asks the user to type a bank code**, because that is
  exactly what `POST /wallet/withdraw` accepts. A typo goes straight to
  Paystack's transfer-recipient call and comes back as a failed withdrawal.
  Backend `GET /bank` + `GET /bank/resolve` passthroughs would let this be a
  picker with account-name confirmation — I'd like to do that follow-up.
- Amounts are formatted with the existing `formatNaira` helper, which rounds to
  whole naira for display. Fine for balances; flagging it in case you want kobo
  precision in the transaction list.

---
---

# PR 3 — `feature/account-deletion` → `develop`

**Title:** `feat(settings): add in-app delete account flow (Apple App Store 5.1.1(v))`

## Description

Apple App Store guideline 5.1.1(v) requires that an account created in the app
can be deleted from inside the app. There was no such flow and no entry point
for one.

Adds a **Danger Zone** row in Settings leading to a dedicated screen with three
gates, because the action cannot be undone:

1. The server's `deletion-check` reports any blockers up front (money still in
   the wallet, orders in flight) with a re-check button.
2. The user types `DELETE`.
3. The user confirms their password — a 30-day bearer token off an unattended
   device is not a good enough bar for an irreversible action.

The screen also states plainly what is destroyed versus what is retained and
why, rather than leaving the user to guess.

Blockers are re-read on focus, since the user may have gone off to withdraw a
balance or cancel an order to clear one, and again if the delete itself fails —
a blocker can appear between the check and the call. **The local session is
cleared only on success**, so a wrong password leaves the user signed in to
retry rather than logging them out.

## Tickets

Ticket ID [link]

## Related Issue

Fixes #[Issue number]

## Type of Change

- [ ] Bug fix
- [x] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?

**Unit test coverage report: N/A** — no JS test runner in this repo.

**TypeScript:** `tsc --noEmit` at **14 errors, identical to the `develop`
baseline**, none in any file this PR touches.

**Both endpoints this screen calls were verified over real HTTP**, and every
branch the UI handles was exercised server-side:

| Case | Result |
|---|---|
| `GET /users/account/deletion-check`, clean account | ✅ 200, `can_delete: true` |
| Wrong password | ✅ 401 — screen keeps the session and lets the user retry |
| Bad confirmation string | ✅ 422 |
| Successful deletion | ✅ 200 |
| Pre-deletion bearer token afterwards | ✅ 401 — token stops working |
| Log in again as the deleted account | ✅ refused |
| Funded account | ✅ `wallet_balance` blocker, deletion refused with 409 |
| Account with an order in flight | ✅ `open_orders_buying` blocker, refused with 409 |
| Account after a refused deletion | ✅ still fully usable |

**Still needs a device pass.** Not verified on a device or simulator: the
navigation into and out of the screen, keyboard handling on the two inputs, and
the post-deletion redirect to the guest landing screen. The API contract and
every error branch are verified; the UI is not.

## Tested & Approved by?

[QA Engineer]

## Checklist

- [x] My code follows the project's style guidelines
- [x] I have performed a self-review of my code
- [x] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [x] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [x] New and existing unit tests pass locally with my changes

## Additional Notes

- **Depends on `feature/account-deletion` (backend) being deployed first.**
  Without it both calls 404 and the screen is unusable.
- **This is the App Store compliance item** — worth prioritising if a submission
  is pending. Reviewers check that deletion is reachable and completes in-app.
- The copy on the screen states what is destroyed vs. retained. If Legal or
  Support have a preferred wording for the retention explanation, that text is
  in one place at the top of `deleteAccountScreen.tsx` (`REMOVED` / `RETAINED`)
  and is trivial to swap.
- The screen shows the 409's message on a blocked delete and re-reads
  `deletion-check` for the structured list. The 409 body itself carries only the
  message, not the blocker array (flask-smorest drops extra keys) — noted here
  because it looks like an omission in the client otherwise.

---
---

# PR 4 — `feature/moderation-and-saved-ui` → `develop`

> **Branches from `feature/feed-optimization-and-wiring`, not `develop`** — it
> modifies the same feed cards. Merge that PR first.

**Title:** `feat(feed): add save, report and block from the feed`

## Description

Wires the moderation and saved-items endpoints into the app. Reporting and
blocking are **App Store 1.2 requirements** for user-generated content, so until
now the backend satisfied the guideline and the app didn't.

One "…" on each feed card opens a **single sheet with internal steps** rather
than a stack of sheets: actions → pick a reason → optional detail → done. Each
step asks for exactly one thing, with a back affordance and a caption so you
always know where you are and how much is left.

Craft decisions worth calling out:

- **Reasons are written for the person tapping**, not for the moderation queue —
  "Scam or fraud — trying to take money or details dishonestly". The two most
  likely answers sit at the top so most people never scroll, and
  counterfeit/prohibited-item only appear for products.
- **Save is first** — it's the everyday action and belongs where the thumb is.
  It toggles optimistically and rolls back with a real message if the write
  fails.
- **Block is offered again on the report success screen**, because "report then
  block" is the actual shape of that moment rather than two unrelated errands.
- **Blocking removes the author's items from the list immediately** rather than
  waiting for the next fetch, so the action reads as instant.
- Detail is optional for every reason except "Something else", where the copy
  asks for it — the only place a free-text box earns its keep.

New screens: **`/saved`** (filterable, pull-to-refresh, pagination, empty state
that points back at the feed) and **Settings → Blocked accounts**, so a one-tap
block isn't a dead end.

## Tickets / Related Issue

Ticket ID [link] · Fixes #[Issue number]

## Type of Change
- [ ] Bug fix
- [x] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?

**Unit test coverage report: N/A** — no JS test runner in this repo.

**TypeScript:** `tsc --noEmit` at **14 errors, identical to the `develop`
baseline**, none in any file this PR touches.

**Every call shape the client sends was verified against a live server:** save
returns 201; report is accepted with details and returns `pending`; a repeat
report returns the same `report_id` with `already_reported: true`; the saved list
returns the product with its title and price; block drops the feed from 7 items
to 4 and unblock restores it.

**Still needs a device pass.** Not verified on a device or simulator: the sheet's
step transitions and snap points, keyboard behaviour over the detail field,
optimistic-toggle feel, and how the empty states look at large dynamic type
settings.

## Tested & Approved by? — [QA Engineer]

## Checklist
- [x] Style guidelines · [x] Self-review · [x] Commented · [ ] Docs · [x] No new warnings · [ ] Tests added · [x] Existing tests pass

## Additional Notes

- **Depends on backend `feat/content-reporting` and `feat/saved-items` being
  deployed.** Without them the "…" sheet's Save/Report/Block all fail.
- **Accessibility:** every row is ≥44pt (56 where a caption is present), roles,
  labels and state on all controls, the reason picker exposes its selected state,
  and destructive actions are labelled with the target's name rather than "this".
  No custom animation — the sheet library's transitions already respect
  reduced-motion.
- **Not done: `saved_by_me` on feed items.** The sheet tracks saved state
  locally for the session, so a card won't show as already-saved after a cold
  start until the feed payload carries the flag. Backend `saved_ids()` exists for
  exactly this; wiring it into feed hydration is the follow-up.
- **Guest experience is untouched, and that's the open question.** The feed is
  `@login_required`, so none of this is reachable before signup. If you want
  "value before friction", opening the feed to anonymous callers is the lever —
  flagged in the backend PR bodies.
