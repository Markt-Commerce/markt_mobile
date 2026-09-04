## Description
This PR improves core mobile UX across chat, auth/navigation, product discovery, and Android layout. It ships scroll-to-bottom chat behavior, one-tap attachment sending, protected post-login navigation (fixing iOS swipe-back to introduction), product-scoped messaging with self-chat guards, niche detail routing and posts loading, chat avatars and product image display, message reactions (REST + socket), and Android safe-area padding for the bottom tab bar under edge-to-edge display.

**Commit range:** `2cc5cb8` → `HEAD` (6 commits on `develop`)

## Tickets
- [Mobile] Chat UX — scroll on open, attachments, avatars, product cards, reactions
- [Mobile] Auth & navigation — protected routes, replace-only redirects, no swipe-back to guest intro
- [Mobile] Product detail — Message Seller flow, ₦ pricing, image URI normalization
- [Mobile] Niches & posts — route conflict fix, posts on niche detail, post details SafeArea + comment avatar
- [Mobile] Android — tab bar inset above system navigation bar

## Related Issue
Addresses chat usability gaps, iOS navigation regression after login, broken niche/post routes, missing chat media and avatars, non-functional or incomplete message reactions, and Android system nav overlapping the app tab menu.

## Type of Change
- [ ] Breaking change
- [x] New feature
- [x] Bug fix
- [ ] Documentation update

## How Has This Been Tested?

### Chat
- [ ] Open a room — list scrolls to latest message on first load
- [ ] Send photo / product / request attachment — sheet closes on success; double-send blocked while busy
- [ ] Peer avatars persist on all bubbles (including product/socket messages); own avatar from profile when available
- [ ] Product picker and shared product cards show images when API provides `media` / `image_url`
- [ ] Add/remove emoji reaction — chips update; picker toggle works; (optional) second device/socket updates counts

### Auth & navigation
- [ ] Log in — lands on tabs; swipe-back does not return to introduction
- [ ] Log out — no `POP_TO_TOP` warning; guest stack via `replace` only

### Product & messaging
- [ ] Product detail — price shows ₦; invalid image URIs do not crash
- [ ] Message Seller — room created on tap only; reuses existing room; cannot message own listing
- [ ] Quick chat sheet — loading/error states; idempotent create-or-get

### Niches & posts
- [ ] Discover / My Niches → niche detail loads (no “route not found”)
- [ ] Niche detail — posts list loads on first visit (not only page > 1)
- [ ] Post details — SafeAreaView; comment input uses user avatar

### Android layout
- [ ] Tab bar (Home, Search, Requests, Orders, Messages) sits above 3-button nav — no overlap

### iOS regression
- [ ] Tab bar and home layout unchanged vs prior (bottom inset applied on Android only)

## Tested & Approved by?
- [ ] QA / device testing (iOS + Android)
- [ ] Product owner review
- [x] Developer self-review

## Checklist
- [x] My code follows the project's style guidelines
- [x] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation (API markdown guides in repo root are untracked reference docs)
- [x] My changes generate no new warnings (known pre-existing FlatList typing in `chat.tsx` if present)
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Commits included

| Commit | Summary |
|--------|---------|
| `2cc5cb8` | Chat scroll-to-bottom on open; send-on-tap attachments with busy guard and success feedback |
| `373dc45` | Prevent iOS swipe-back to introduction after login (protected routes + stack reset) |
| `809f283` | Product detail chat on tap only, reuse rooms, self-chat guard, ₦/image fixes, replace-only auth redirect |
| `8910690` | Niche detail routing and posts load; post details SafeAreaView and comment avatar |
| `9c80031` | Chat avatars, product images in picker/cards, and message reactions |
| `91572d9` | Android tab bar safe area above system navigation |

## Additional Notes

### 🎯 Chat

**Scroll & attachments**
- Initial scroll to bottom via `onContentSizeChange` + refs
- `ChatAttachmentSheet` / pickers: `sending` guard, success toasts, sheet closes after send
- New `requestPicker.tsx` for buyer request attachments

**Avatars** (`utils/chatAvatar.ts`)
- Backfill `sender` from route `otherUser` or current user profile when API/socket omits nested sender
- `profile_picture_url` support; `Avatar` resets image error when `uri` changes

**Product messages** (`utils/imageUri.ts`, `chatProductDisplayComponent.tsx`, `productPicker.tsx`)
- `resolveProductImageUri()` across `media`, `image_url`, and `images[0].url`
- Fetch product by id when snapshot has name/price but no image
- Optimistic share includes image from seller product list when available

**Reactions** (`utils/chatReactions.ts`, `services/chatSock.ts`)
- GET/POST/DELETE reactions per `CHAT_MESSAGE_REACTIONS_API_AND_FRONTEND.md`
- Load reactions for all messages in page (not only first 20); string id map keys
- `join_message` + `message_reaction_added` / `removed` / `stats` socket listeners
- Optimistic UI + refetch; picker toggle and `has_reacted` highlight

### 🔐 Auth & navigation

- Single `Stack` with `Stack.Protected` for logged-in `(tabs)` vs guest `introduction` / `(entrances)`
- `utils/authNavigation.ts`: `router.replace` only (removed `dismissAll()` → fixes logout `POP_TO_TOP` dev warning)
- Introduction screen redirects if session already restored

### 🛒 Product detail & chat entry

- `utils/chatGuards.ts` — block messaging own listing
- `utils/formatCurrency.ts` — `formatNaira()`
- `normalizeUri` / `resolveMediaUri` for product images
- `QuickChatBottomSheet` — open sheet before create room; documented idempotent `createOrGetRoom`

### 📂 Niches & posts

- Resolved `app/niches.tsx` vs `app/niches/[id].tsx` conflict → `niches/_layout.tsx` + `niches/index.tsx`
- Fixed `loadNichePosts` so page 1 loads on mount
- Post details: `SafeAreaView`, comment `Avatar` from `getUserProfile()`

### 📱 Android edge-to-edge

- `app.json`: `edgeToEdgeEnabled: true` (unchanged)
- Tab bar `paddingBottom` / `height` += `useSafeAreaInsets().bottom` on Android only
- Root `SafeAreaProvider` in `app/_layout.tsx`

**Do not disable system navigation** — inset padding is the supported approach per Expo/Android 15+ guidance.

### 📁 Key files (33 files, +1293 / −520 lines)

| Area | Files |
|------|--------|
| Chat | `components/chat.tsx`, `quickChatBottomSheet.tsx`, `chatAttachmentSheet.tsx`, `chatProductDisplayComponent.tsx`, `productPicker.tsx`, `requestPicker.tsx` |
| Utils | `chatAvatar.ts`, `chatReactions.ts`, `chatGuards.ts`, `imageUri.ts`, `formatCurrency.ts`, `authNavigation.ts` |
| Services | `services/chatSock.ts`, `services/sections/chat.ts` |
| Auth / shell | `app/_layout.tsx`, `app/introduction.tsx`, `hooks/userContextProvider.tsx` |
| Tabs / nav | `app/(tabs)/_layout.tsx`, `index.tsx`, `messages.tsx`, `profile.tsx` |
| Product / niches / posts | `app/productDetails/[id].tsx`, `app/niches/*`, `app/postDetails/[id].tsx`, `app/discoverNiches.tsx`, `app/myniches.tsx` |
| UI | `components/Avatar.tsx`, `models/chat.ts` |

### ⚠️ Notes for reviewers

- Untracked `*.md` API guides in repo root are **not** part of this PR unless explicitly added
- Reactions require backend `GET/POST/DELETE /chats/messages/:id/reactions` and optional socket events
- Product images in chat depend on seller product list / message `message_data.product` returning valid URLs

### 📋 Suggested PR title

```
fix(mobile): chat UX, auth navigation, niches/posts, reactions, and Android tab bar insets
```

### 🔄 Deployment / QA checklist

- [ ] Smoke test chat on iOS and Android (physical device for nav bar)
- [ ] Login → back gesture → still on tabs (iOS)
- [ ] Logout → guest home without navigation warnings
- [ ] Niche card → detail → posts visible
- [ ] Message Seller from product (buyer, not own product)
- [ ] React to a message; verify API 2xx in network tab
